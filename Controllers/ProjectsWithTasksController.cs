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
            .Include(p => p.Tasks)
                .ThenInclude(t => t.Todos) 
                .Include(p => p.Tasks)
                .ThenInclude(t => t.AssignedEmployees)
                    .ThenInclude(a => a.Employee)
            .ThenInclude(e => e.Department) // moved one indent to avoid EF confusion
            .ToListAsync();

        // Force load: make sure related entities are not null due to proxy issues
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

        return Ok(projects);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProjectDetails(int id)
    {
        var project = await _context.Projects
            .Include(p => p.Department)
            .Include(p => p.Tasks)
                .ThenInclude(t => t.AssignedEmployees)
                    .ThenInclude(a => a.Employee)
            .ThenInclude(e => e.Department)
            .FirstOrDefaultAsync(p => p.Pnumber == id);

        if (project == null)
            return NotFound();

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

        return Ok(project);
    }
}
