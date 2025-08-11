using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApiProject.Data;
using MyApiProject.Models;
using MyApiProject.Models.Dto;

namespace MyApiProject.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TasksController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TasksController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<ProjectTask>>> GetTasks()
        {
            return await _context.Tasks.ToListAsync();
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<TaskDto>> GetTask(int id)
        {
            var task = await _context.Tasks
                .Include(t => t.Todos)                // To-do’ları dahil ettik
                .Include(t => t.AssignedEmployees)
                .FirstOrDefaultAsync(t => t.TaskID == id);

            if (task == null)
                return NotFound();

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
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult<ProjectTask>> CreateTask(ProjectTask task)
        {
            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetTask), new { id = task.TaskID }, task);
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> UpdateTask(int id, TaskDto dto)
        {
            if (id != dto.TaskID)
                return BadRequest("Task ID uyuşmuyor");

            var existingTask = await _context.Tasks
                .Include(t => t.Todos)
                .Include(t => t.AssignedEmployees)
                .FirstOrDefaultAsync(t => t.TaskID == id);

            if (existingTask == null)
                return NotFound("Task bulunamadı.");

            // Temel alanlar
            existingTask.TaskName = dto.TaskName;
            existingTask.Start_date = dto.Start_date;
            existingTask.Due_date = dto.Due_date;
            existingTask.Completion_rate = dto.Completion_rate;
            existingTask.Task_number = dto.Task_number;
            existingTask.Pnumber = dto.Pnumber;

            // To-do’ları sıfırla ve yeniden ekle
            _context.TaskTodos.RemoveRange(existingTask.Todos);
            if (dto.Todos != null)
            {
                foreach (var td in dto.Todos)
                {
                    _context.TaskTodos.Add(new TaskTodo
                    {
                        TaskID = existingTask.TaskID,
                        TodoIndex = td.TodoIndex,
                        Description = td.Description,
                        Importance = null, // istersen dto’ya ekle
                        IsCompleted = td.IsCompleted
                    });
                }
            }

            // Assigned_To’yu sıfırla ve yeniden ekle
            _context.AssignedTos.RemoveRange(existingTask.AssignedEmployees);
            if (dto.Assignments != null)
            {
                for (int i = 0; i < dto.Assignments.Count; i++)
                {
                    var employeeList = dto.Assignments[i];
                    if (employeeList == null) continue;

                    foreach (var ssn in employeeList)
                    {
                        _context.AssignedTos.Add(new AssignedTo
                        {
                            TaskID = existingTask.TaskID,
                            SSN = ssn,
                            TodoIndex = i
                        });
                    }
                }
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TaskExists(id))
                    return NotFound();
                else
                    throw;
            }

            await UpdateProjectCompletion(existingTask.Pnumber ?? 0);
            return Ok(dto);
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null)
                return NotFound();

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private bool TaskExists(int id)
        {
            return _context.Tasks.Any(e => e.TaskID == id);
        }

        private async Task UpdateProjectCompletion(int projectId)
        {
            var project = await _context.Projects
                .Include(p => p.Tasks)
                .FirstOrDefaultAsync(p => p.Pnumber == projectId);

            if (project != null && project.Tasks.Any())
            {
                var avg = (int)Math.Round(project.Tasks.Average(t => (decimal)(t.Completion_rate ?? 0)));
                project.Completion_status = avg;
                _context.Entry(project).State = EntityState.Modified;
                await _context.SaveChangesAsync();
            }
        }
    }
}
