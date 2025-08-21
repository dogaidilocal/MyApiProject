using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApiProject.Data;
using MyApiProject.Models;
using System.Linq;

namespace MyApiProject.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectsWithTasksController : ControllerBase
    {
        private readonly AppDbContext _context;
        public ProjectsWithTasksController(AppDbContext context) => _context = context;

        // GET: api/ProjectsWithTasks
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetProjectsWithTasks()
        {
            try
            {
                // Projeleri yükle (AssignedEmployees hariç - ayrı çekeceğiz)
                var list = await _context.Projects
                    .AsNoTracking()
                    .Include(p => p.Department)
                    .Include(p => p.ProjectLeaders).ThenInclude(pl => pl.Employee)
                    .Include(p => p.Tasks).ThenInclude(t => t.Todos)
                    .OrderBy(p => p.Pnumber)
                    .ToListAsync();

                // Atamaları hafif projeksiyon ile çek (Id kolonu gerektirmeden)
                var assignments = await _context.AssignedTos
                    .AsNoTracking()
                    .Select(a => new { a.TaskID, a.TodoIndex, a.SSN })
                    .ToListAsync();

                var assignmentsByTask = assignments
                    .GroupBy(a => a.TaskID)
                    .ToDictionary(
                        g => g.Key,
                        g => g
                            .GroupBy(x => x.TodoIndex)
                            .OrderBy(x => x.Key)
                            .Select(x => x.Select(v => v.SSN).Where(ssn => !string.IsNullOrWhiteSpace(ssn)).ToArray())
                            .ToArray()
                    );

                var data = list.Select(p => new
                {
                    pnumber = p.Pnumber,
                    pname = p.Pname ?? "",
                    start_date = p.Start_date,
                    due_date = p.Due_date,
                    completion_status = p.Completion_status ?? 0,
                    dnumber = p.Dnumber,
                    department = p.Department == null
                        ? null
                        : new { dnumber = p.Department.Dnumber, dname = p.Department.Dname ?? "" },

                    leader = (p.ProjectLeaders ?? new List<ProjectLeader>())
                        .OrderByDescending(pl => pl.Start_date)
                        .Select(pl => new
                        {
                            leaderID = pl.LeaderID ?? "",
                            fullName = pl.Employee != null
                                ? ($"{pl.Employee.Fname ?? ""} {pl.Employee.Lname ?? ""}").Trim()
                                : null
                        })
                        .FirstOrDefault(),

                    tasks = (p.Tasks ?? new List<ProjectTask>()).Select(t => new
                    {
                        taskID = t.TaskID,
                        taskName = t.TaskName ?? "",
                        start_date = t.Start_date,
                        due_date = t.Due_date,
                        completion_rate = t.Completion_rate ?? 0,
                        task_number = t.Task_number ?? 0,
                        pnumber = t.Pnumber,

                        // To-do'lar
                        Todos = (t.Todos ?? new List<TaskTodo>())
                            .OrderBy(td => td.TodoIndex)
                            .Select(td => new
                            {
                                TodoIndex = td.TodoIndex,
                                Description = td.Description ?? "",
                                Importance = td.Importance ?? 0,
                                IsCompleted = td.IsCompleted
                            })
                            .ToList(),

                        // TaskDetails için beklenen isimle gönderelim
                        Assignments = assignmentsByTask.TryGetValue(t.TaskID, out var groups)
                            ? groups
                            : Array.Empty<string[]>()
                    }).ToList()
                });

                return Ok(data);
            }
            catch (Exception ex)
            {
                // Log the exception for debugging
                return StatusCode(500, new { 
                    error = "Internal server error", 
                    details = ex.Message,
                    stackTrace = ex.StackTrace,
                    innerException = ex.InnerException?.Message
                });
            }
        }

        // GET: api/ProjectsWithTasks/5
        [HttpGet("{id:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProjectDetails(int id)
        {
            try
            {
                var p = await _context.Projects
                    .AsNoTracking()
                    .Where(x => x.Pnumber == id)
                    .Include(x => x.Department)
                    .Include(x => x.ProjectLeaders).ThenInclude(pl => pl.Employee)
                    .Include(x => x.Tasks).ThenInclude(t => t.Todos)
                    .FirstOrDefaultAsync();

                if (p == null) return NotFound();

                var taskIds = (p.Tasks ?? new List<ProjectTask>()).Select(t => t.TaskID).ToList();
                var groupsByTask = new Dictionary<int, string[][]>();
                
                if (taskIds.Count > 0)
                {
                    var assignments = await _context.AssignedTos
                        .AsNoTracking()
                        .Where(a => taskIds.Contains(a.TaskID))
                        .Select(a => new { a.TaskID, a.TodoIndex, a.SSN })
                        .ToListAsync();

                    groupsByTask = assignments
                        .GroupBy(a => a.TaskID)
                        .ToDictionary(
                            g => g.Key,
                            g => g
                                .GroupBy(x => x.TodoIndex)
                                .OrderBy(x => x.Key)
                                .Select(x => x.Select(v => v.SSN).Where(ssn => !string.IsNullOrWhiteSpace(ssn)).ToArray())
                                .ToArray()
                        );
                }

                var result = new
                {
                    pnumber = p.Pnumber,
                    pname = p.Pname ?? "",
                    start_date = p.Start_date,
                    due_date = p.Due_date,
                    completion_status = p.Completion_status ?? 0,
                    dnumber = p.Dnumber,
                    department = p.Department == null
                        ? null
                        : new { dnumber = p.Department.Dnumber, dname = p.Department.Dname ?? "" },

                    leader = (p.ProjectLeaders ?? new List<ProjectLeader>())
                        .OrderByDescending(pl => pl.Start_date)
                        .Select(pl => new
                        {
                            leaderID = pl.LeaderID ?? "",
                            fullName = pl.Employee != null
                                ? ($"{pl.Employee.Fname ?? ""} {pl.Employee.Lname ?? ""}").Trim()
                                : null
                        })
                        .FirstOrDefault(),

                    tasks = (p.Tasks ?? new List<ProjectTask>()).Select(t => new
                    {
                        taskID = t.TaskID,
                        taskName = t.TaskName ?? "",
                        start_date = t.Start_date,
                        due_date = t.Due_date,
                        completion_rate = t.Completion_rate ?? 0,
                        task_number = t.Task_number ?? 0,
                        pnumber = t.Pnumber,
                        Todos = (t.Todos ?? new List<TaskTodo>())
                            .OrderBy(td => td.TodoIndex)
                            .Select(td => new
                            {
                                TodoIndex = td.TodoIndex,
                                Description = td.Description ?? "",
                                Importance = td.Importance ?? 0,
                                IsCompleted = td.IsCompleted
                            })
                            .ToList(),
                        Assignments = groupsByTask.TryGetValue(t.TaskID, out var arr)
                            ? arr
                            : Array.Empty<string[]>()
                    }).ToList()
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    error = "Internal server error", 
                    details = ex.Message,
                    stackTrace = ex.StackTrace,
                    innerException = ex.InnerException?.Message
                });
            }
        }

        // GET: api/ProjectsWithTasks/test
        [HttpGet("test")]
        [AllowAnonymous]
        public async Task<IActionResult> TestData()
        {
            try
            {
                var projectCount = await _context.Projects.CountAsync();
                var taskCount = await _context.Tasks.CountAsync();
                var leaderCount = await _context.ProjectLeaders.CountAsync();
                var todoCount = await _context.TaskTodos.CountAsync();
                var assignmentCount = await _context.AssignedTos.CountAsync();

                var sampleProject = await _context.Projects
                    .AsNoTracking()
                    .Include(p => p.Department)
                    .Include(p => p.ProjectLeaders)
                    .Include(p => p.Tasks)
                    .FirstOrDefaultAsync();

                return Ok(new
                {
                    counts = new
                    {
                        projects = projectCount,
                        tasks = taskCount,
                        leaders = leaderCount,
                        todos = todoCount,
                        assignments = assignmentCount
                    },
                    sampleProject = sampleProject != null ? new
                    {
                        pnumber = sampleProject.Pnumber,
                        pname = sampleProject.Pname,
                        hasDepartment = sampleProject.Department != null,
                        hasLeaders = sampleProject.ProjectLeaders?.Count > 0,
                        hasTasks = sampleProject.Tasks?.Count > 0
                    } : null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
            }
        }
    }
}