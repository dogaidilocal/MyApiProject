using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApiProject.Data;
using MyApiProject.Models;
using MyApiProject.Models.Dto;
using System.Security.Claims;

namespace MyApiProject.Controllers
{
    [ApiController]
    [Route("api/Tasks")]
    [Produces("application/json")]
    public class TasksController : ControllerBase
    {
        private readonly AppDbContext _context;
        public TasksController(AppDbContext context) => _context = context;

        // ---- helpers: role checks ----
        private static bool IsAdmin(ClaimsPrincipal user) => user.IsInRole("admin");

        private async Task<string?> FindEmployeeSsnForUsernameAsync(string? username)
        {
            var u = (username ?? string.Empty).Trim().ToLower();
            if (string.IsNullOrEmpty(u)) return null;
            var list = await _context.Employees.AsNoTracking().ToListAsync();
            foreach (var e in list)
            {
                var f = (e.Fname ?? string.Empty).Trim().ToLower();
                var l = (e.Lname ?? string.Empty).Trim().ToLower();
                if (u == f || u == ($"{f}.{l}") || u == ($"{f}{l}")) return e.SSN;
            }
            return null;
        }

        private async Task<bool> IsLeaderOfTaskAsync(ClaimsPrincipal user, int taskId)
        {
            var ssn = await FindEmployeeSsnForUsernameAsync(user.Identity?.Name);
            if (string.IsNullOrEmpty(ssn)) return false;

            var task = await _context.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.TaskID == taskId);
            if (task == null) return false;

            var leader = await _context.ProjectLeaders
                .AsNoTracking()
                .OrderByDescending(x => x.Start_date)
                .FirstOrDefaultAsync(x => x.Pnumber == task.Pnumber);
            return leader != null && string.Equals(leader.LeaderID, ssn, StringComparison.OrdinalIgnoreCase);
        }

        [HttpGet("hello")]
        [AllowAnonymous]
        public IActionResult Hello() => Ok("Tasks alive");

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<ProjectTask>>> GetTasks()
            => await _context.Tasks.ToListAsync();

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<TaskDto>> GetTask(int id)
        {
            var task = await _context.Tasks
                .Include(t => t.Todos)
                .Include(t => t.AssignedEmployees)
                .FirstOrDefaultAsync(t => t.TaskID == id);

            if (task == null) return NotFound();

            var dto = new TaskDto
            {
                TaskID = task.TaskID,
                TaskName = task.TaskName,
                Start_date = task.Start_date,
                Due_date = task.Due_date,
                Completion_rate = task.Completion_rate,
                Task_number = task.Task_number,
                Pnumber = task.Pnumber,
                Todos = task.Todos
                    .OrderBy(td => td.TodoIndex)
                    .Select(td => new TodoDto
                    {
                        TodoIndex = td.TodoIndex,
                        Description = td.Description,
                        Importance = td.Importance,
                        IsCompleted = td.IsCompleted
                    })
                    .ToList(),
                Assignments = task.AssignedEmployees
                    .GroupBy(a => a.TodoIndex)
                    .OrderBy(g => g.Key)
                    .Select(g => g.Select(a => a.SSN).ToList())
                    .ToList()
            };

            return dto;
        }

        [HttpPost]
        [Authorize] // Admin veya ilgili projenin lideri ekleyebilir
        public async Task<ActionResult<ProjectTask>> CreateTask(ProjectTask task)
        {
            if (!IsAdmin(User))
            {
                // Yeni task: Pnumber üzerinden kontrol
                var ssn = await FindEmployeeSsnForUsernameAsync(User.Identity?.Name);
                if (string.IsNullOrEmpty(ssn)) return Forbid();
                var leader = await _context.ProjectLeaders.AsNoTracking()
                    .OrderByDescending(x => x.Start_date)
                    .FirstOrDefaultAsync(x => x.Pnumber == task.Pnumber);
                if (leader == null || !string.Equals(leader.LeaderID, ssn, StringComparison.OrdinalIgnoreCase))
                    return Forbid();
            }

            // TaskID tablo tarafında identity değil. Sağlanmamışsa ya da çakışıyorsa yeni id ver.
            if (task.TaskID == 0 || await _context.Tasks.AnyAsync(t => t.TaskID == task.TaskID))
            {
                var maxId = await _context.Tasks.MaxAsync(t => (int?)t.TaskID) ?? 0;
                task.TaskID = maxId + 1;
            }

            if (task.Start_date.HasValue)
                task.Start_date = DateTime.SpecifyKind(task.Start_date.Value, DateTimeKind.Utc);
            if (task.Due_date.HasValue)
                task.Due_date = DateTime.SpecifyKind(task.Due_date.Value, DateTimeKind.Utc);

            _context.Tasks.Add(task);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                // Eğer eşzamanlı başka bir ekleme aynı TaskID'yi aldıysa tekrar deneyelim
                if (ex.InnerException != null && ex.InnerException.Message.Contains("duplicate key"))
                {
                    var maxId2 = await _context.Tasks.MaxAsync(t => (int?)t.TaskID) ?? 0;
                    task.TaskID = maxId2 + 1;
                    _context.Entry(task).State = EntityState.Added;
                    await _context.SaveChangesAsync();
                }
                else
                {
                    throw;
                }
            }
            return CreatedAtAction(nameof(GetTask), new { id = task.TaskID }, task);
        }

        [HttpPut("{id}")]
        [Authorize] // Admin veya ilgili projenin lideri güncelleyebilir
        public async Task<IActionResult> UpdateTask(int id, TaskDto dto)
        {
            if (id != dto.TaskID) return BadRequest("Task ID uyuşmuyor");

            var existing = await _context.Tasks
                .Include(t => t.Todos)
                .Include(t => t.AssignedEmployees)
                .FirstOrDefaultAsync(t => t.TaskID == id);

            if (existing == null) return NotFound("Task bulunamadı.");

            if (!IsAdmin(User))
            {
                var can = await IsLeaderOfTaskAsync(User, id);
                if (!can) return Forbid();
            }

            // temel alanlar
            existing.TaskName = dto.TaskName;
            existing.Start_date = dto.Start_date?.ToUniversalTime();
            existing.Due_date   = dto.Due_date?.ToUniversalTime();
            existing.Completion_rate = dto.Completion_rate;
            existing.Task_number = dto.Task_number;
            existing.Pnumber = dto.Pnumber;

            // 1) mevcut to-do'ları ve atamaları sil
            _context.TaskTodos.RemoveRange(existing.Todos);
            _context.AssignedTos.RemoveRange(existing.AssignedEmployees);

            // 2) to-do'ları yeniden ekle
            if (dto.Todos != null)
            {
                var toAddTodos = dto.Todos.Select(td => new TaskTodo
                {
                    TaskID = dto.TaskID,
                    TodoIndex = td.TodoIndex,
                    Description = td.Description ?? "",
                    Importance = td.Importance,
                    IsCompleted = td.IsCompleted
                });
                await _context.TaskTodos.AddRangeAsync(toAddTodos);
            }

            // 3) atamaları yeniden ekle
            if (dto.Assignments != null)
            {
                for (int i = 0; i < dto.Assignments.Count; i++)
                {
                    var list = dto.Assignments[i];
                    if (list == null) continue;

                    foreach (var ssn in list.Where(s => !string.IsNullOrWhiteSpace(s)))
                    {
                        await _context.AssignedTos.AddAsync(new AssignedTo
                        {
                            TaskID = dto.TaskID,
                            SSN = ssn,
                            TodoIndex = i
                        });
                    }
                }
            }

            // 4) tüm değişiklikleri kaydet
            await _context.SaveChangesAsync();

            return Ok(dto);
        }

        [HttpDelete("{id}")]
        [Authorize] // Admin veya ilgili projenin lideri silebilir
        public async Task<IActionResult> DeleteTask(int id)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null) return NotFound();

            if (!IsAdmin(User))
            {
                var can = await IsLeaderOfTaskAsync(User, id);
                if (!can) return Forbid();
            }

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}