using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApiProject.Data;
using MyApiProject.Models;

[ApiController]
[Route("api/[controller]")]
public class ProjectsWithTasksController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProjectsWithTasksController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetProjectsWithTasks()
    {
        var projects = await _context.Projects
            .Include(p => p.Department)
            .Include(p => p.Tasks).ThenInclude(t => t.Todos)
            .Include(p => p.Tasks).ThenInclude(t => t.AssignedEmployees).ThenInclude(a => a.Employee)
            .Include(p => p.ProjectLeaders)              // ⬅️ EKLENDİ
                .ThenInclude(pl => pl.Employee)          // ⬅️ EKLENDİ
            .ToListAsync();

        // (Opsiyonel) “forced load” bloğu sende kalabilir; bir şey değiştirmedim
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

        return Ok(projects.Select(p => new
        {
            p.Pnumber,
            p.Pname,
            p.Start_date,
            p.Due_date,
            p.Completion_status,
            p.Dnumber,
            Department = p.Department,
            Tasks = p.Tasks,
            // ⬇️ listede gösterim için leader bilgisi
            Leader = p.ProjectLeaders
                .OrderByDescending(x => x.Start_date)
                .Select(x => new {
                    x.LeaderID,
                    FullName = (x.Employee != null) ? $"{x.Employee.Fname} {x.Employee.Lname}".Trim() : null
                })
                .FirstOrDefault()
        }));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProjectDetails(int id)
    {
        var project = await _context.Projects
            .Include(p => p.Department)
            .Include(p => p.Tasks).ThenInclude(t => t.AssignedEmployees).ThenInclude(a => a.Employee)
            .Include(p => p.ProjectLeaders).ThenInclude(pl => pl.Employee)   // ⬅️ EKLENDİ
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

        return Ok(new
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
                .Select(x => new {
                    x.LeaderID,
                    FullName = (x.Employee != null) ? $"{x.Employee.Fname} {x.Employee.Lname}".Trim() : null
                })
                .FirstOrDefault()
        });
    }
}
