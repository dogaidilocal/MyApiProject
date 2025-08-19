using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApiProject.Data;
using MyApiProject.Models;
using System.Security.Claims;

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

        private async Task<bool> IsLeaderOfAsync(ClaimsPrincipal user, int pnumber)
        {
            var ssn = await FindEmployeeSsnForUsernameAsync(user.Identity?.Name);
            if (string.IsNullOrEmpty(ssn)) return false;
            var leader = await _context.ProjectLeaders
                .AsNoTracking()
                .OrderByDescending(x => x.Start_date)
                .FirstOrDefaultAsync(x => x.Pnumber == pnumber);
            return leader != null && string.Equals(leader.LeaderID, ssn, StringComparison.OrdinalIgnoreCase);
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

            // Pnumber benzersizlik kontrolü – 409 döndür, 500'e düşmesin
            var exists = await _context.Projects.AnyAsync(p => p.Pnumber == project.Pnumber);
            if (exists)
                return Conflict($"Project with Pnumber {project.Pnumber} already exists.");

            if (project.Start_date.HasValue)
                project.Start_date = DateTime.SpecifyKind(project.Start_date.Value, DateTimeKind.Utc);
            if (project.Due_date.HasValue)
                project.Due_date = DateTime.SpecifyKind(project.Due_date.Value, DateTimeKind.Utc);

            try
            {
                _context.Projects.Add(project);
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                // Unique violation gibi durumlarda anlamlı mesaj ver
                return Problem(
                    detail: ex.InnerException?.Message ?? ex.Message,
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Failed to create project");
            }

            return CreatedAtAction(nameof(GetProject), new { id = project.Pnumber }, project);
        }

        // PUT: api/Projects/5
        [HttpPut("{id}")]
        [Authorize] // Admin veya ilgili projenin lideri düzenleyebilir
        public async Task<IActionResult> UpdateProject(int id, Project project)
        {
            if (id != project.Pnumber)
                return BadRequest();

            if (project.Start_date.HasValue)
                project.Start_date = DateTime.SpecifyKind(project.Start_date.Value, DateTimeKind.Utc);
            if (project.Due_date.HasValue)
                project.Due_date = DateTime.SpecifyKind(project.Due_date.Value, DateTimeKind.Utc);

            // Yetki kontrolü
            if (!IsAdmin(User))
            {
                var can = await IsLeaderOfAsync(User, id);
                if (!can) return Forbid();
            }

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
