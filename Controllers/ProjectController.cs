using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApiProject.Data;
using MyApiProject.Models;

namespace MyApiProject.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProjectsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Projects
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<Project>>> GetProjects()
        {
            return await _context.Projects
                .Include(p => p.Tasks)
                .Include(p => p.Department)
                .ToListAsync();
        }

   

        // GET: api/Projects/5
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<Project>> GetProject(int id)
        {
            var project = await _context.Projects
                .Include(p => p.Tasks)
                .Include(p => p.Department)
                .FirstOrDefaultAsync(p => p.Pnumber == id);

            if (project == null)
                return NotFound();

            return project;
        }

        // POST: api/Projects
        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult<Project>> CreateProject(Project project)
        {
            if (project.Pnumber == 0)
                return BadRequest("Pnumber must be provided manually by the admin.");

            if (project.Start_date.HasValue)
                project.Start_date = DateTime.SpecifyKind(project.Start_date.Value, DateTimeKind.Utc);
            if (project.Due_date.HasValue)
                project.Due_date = DateTime.SpecifyKind(project.Due_date.Value, DateTimeKind.Utc);

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProject), new { id = project.Pnumber }, project);
        }

        // PUT: api/Projects/5
        [HttpPut("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> UpdateProject(int id, Project project)
        {
            if (id != project.Pnumber)
                return BadRequest();

            if (project.Start_date.HasValue)
                project.Start_date = DateTime.SpecifyKind(project.Start_date.Value, DateTimeKind.Utc);
            if (project.Due_date.HasValue)
                project.Due_date = DateTime.SpecifyKind(project.Due_date.Value, DateTimeKind.Utc);

            _context.Entry(project).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Projects.Any(e => e.Pnumber == id))
                    return NotFound();
                else
                    throw;
            }

            return Ok(project);
        }

        /// DELETE: api/Projects/5
[HttpDelete("{id}")]
[Authorize(Policy = "AdminOnly")]
public async Task<IActionResult> DeleteProject(int id)
{
    var project = await _context.Projects
        .Include(p => p.Tasks)
        .FirstOrDefaultAsync(p => p.Pnumber == id);

    if (project == null)
        return NotFound();

    _context.Set<ProjectTask>().RemoveRange(project.Tasks.Cast<ProjectTask>());
    _context.Projects.Remove(project);
    await _context.SaveChangesAsync();

    return NoContent();
}

    }
}
