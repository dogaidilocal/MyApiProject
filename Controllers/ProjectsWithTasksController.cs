using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Cors;
using MyApiProject.Data;

[ApiController]
[Route("api/[controller]")]
[EnableCors("AllowFrontend")] // Bu controller'a policy'yi zorunlu kıl
public class ProjectsWithTasksController : ControllerBase
{
    private readonly AppDbContext _context;
    public ProjectsWithTasksController(AppDbContext context) => _context = context;

    // ---- CORS preflight (ek güvence) -----------------------------------------
    private const string AllowedOrigin = "http://localhost:3000";

    // /api/ProjectsWithTasks için preflight
    [HttpOptions]
    public IActionResult Options()
    {
        var origin = Request.Headers["Origin"].ToString();
        if (origin == AllowedOrigin)
        {
            Response.Headers["Access-Control-Allow-Origin"] = origin;
            Response.Headers["Vary"] = "Origin";
        }
        Response.Headers["Access-Control-Allow-Headers"] = "authorization, content-type";
        Response.Headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS";
        return Ok();
    }

    // /api/ProjectsWithTasks/{id} için preflight
    [HttpOptions("{id}")]
    public IActionResult OptionsById(int id)
    {
        var origin = Request.Headers["Origin"].ToString();
        if (origin == AllowedOrigin)
        {
            Response.Headers["Access-Control-Allow-Origin"] = origin;
            Response.Headers["Vary"] = "Origin";
        }
        Response.Headers["Access-Control-Allow-Headers"] = "authorization, content-type";
        Response.Headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS";
        return Ok();
    }
    // --------------------------------------------------------------------------

    [HttpGet]
    public async Task<IActionResult> GetProjectsWithTasks()
    {
        var projects = await _context.Projects
            .Include(p => p.Department)
            .Include(p => p.Tasks).ThenInclude(t => t.Todos)
            .Include(p => p.Tasks).ThenInclude(t => t.AssignedEmployees).ThenInclude(a => a.Employee)
            .Include(p => p.ProjectLeaders).ThenInclude(pl => pl.Employee)
            .ToListAsync();

        // (Opsiyonel) Department bağlama
        foreach (var project in projects)
        {
            foreach (var task in project.Tasks)
            {
                foreach (var assignment in task.AssignedEmployees)
                {
                    if (assignment.Employee != null && assignment.Employee.Department == null)
                    {
                        assignment.Employee.Department = await _context.Departments
                            .FirstOrDefaultAsync(d => d.Dnumber == assignment.Employee.Dno);
                    }
                }
            }
        }

        var payload = projects.Select(p => new
        {
            p.Pnumber,
            p.Pname,
            p.Start_date,
            p.Due_date,
            p.Completion_status,
            p.Dnumber,
            Department = p.Department,
            Tasks = p.Tasks,
            Leader = p.ProjectLeaders
                .OrderByDescending(x => x.Start_date)
                .Select(x => new
                {
                    x.LeaderID,
                    FullName = (x.Employee != null)
                        ? $"{x.Employee.Fname} {x.Employee.Lname}".Trim()
                        : null
                })
                .FirstOrDefault()
        });

        return Ok(payload);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProjectDetails(int id)
    {
        var project = await _context.Projects
            .Include(p => p.Department)
            .Include(p => p.Tasks).ThenInclude(t => t.AssignedEmployees).ThenInclude(a => a.Employee)
            .Include(p => p.ProjectLeaders).ThenInclude(pl => pl.Employee)
            .FirstOrDefaultAsync(p => p.Pnumber == id);

        if (project == null) return NotFound();

        foreach (var task in project.Tasks)
        {
            foreach (var assignment in task.AssignedEmployees)
            {
                if (assignment.Employee != null && assignment.Employee.Department == null)
                {
                    assignment.Employee.Department = await _context.Departments
                        .FirstOrDefaultAsync(d => d.Dnumber == assignment.Employee.Dno);
                }
            }
        }

        var payload = new
        {
            project.Pnumber,
            project.Pname,
            project.Start_date,
            project.Due_date,
            project.Completion_status,
            project.Dnumber,
            Department = project.Department,
            Tasks = project.Tasks,
            Leader = project.ProjectLeaders
                .OrderByDescending(x => x.Start_date)
                .Select(x => new
                {
                    x.LeaderID,
                    FullName = (x.Employee != null)
                        ? $"{x.Employee.Fname} {x.Employee.Lname}".Trim()
                        : null
                })
                .FirstOrDefault()
        };

        return Ok(payload);
    }
}
