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
    public class ProjectLeadersController : ControllerBase
    {
        private readonly AppDbContext _context;
        public ProjectLeadersController(AppDbContext context) => _context = context;

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<ProjectLeader>>> GetLeaders()
        {
            var leaders = await _context.ProjectLeaders
                .Include(pl => pl.Employee).ThenInclude(e => e.Department)
                .Include(pl => pl.Project)
                .ToListAsync();
            return Ok(leaders);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<ProjectLeader>> GetLeader(string id)
        {
            var leader = await _context.ProjectLeaders
                .Include(pl => pl.Employee)
                .Include(pl => pl.Project)
                .FirstOrDefaultAsync(pl => pl.LeaderID == id);

            if (leader == null) return NotFound();
            return leader;
        }

        // ⬇️ Projedeki aktif lideri getir
        [HttpGet("project/{pnumber}")]
        [AllowAnonymous]
        public async Task<ActionResult<LeaderDto>> GetLeaderForProject(int pnumber)
        {
            var pl = await _context.ProjectLeaders
                .Include(x => x.Employee)
                .Where(x => x.Pnumber == pnumber)
                .OrderByDescending(x => x.Start_date)
                .FirstOrDefaultAsync();

            if (pl == null) return NotFound();

            return new LeaderDto
            {
                LeaderID = pl.LeaderID,
                FullName = $"{pl.Employee?.Fname} {pl.Employee?.Lname}".Trim(),
                Pnumber = pl.Pnumber,
                Dnumber = pl.Dnumber
            };
        }

        // ⬇️ YENİ: projeye lider ata + users.Role=Leader’a yükselt (varsa)
        [HttpPost("project/{pnumber}/assign")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> AssignLeaderToProject(
            int pnumber,
            [FromBody] AssignLeaderRequest body)
        {
            var project = await _context.Projects.FirstOrDefaultAsync(p => p.Pnumber == pnumber);
            if (project == null) return NotFound($"Project {pnumber} not found.");

            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.SSN == body.LeaderSSN);
            if (employee == null) return NotFound($"Employee (SSN={body.LeaderSSN}) not found.");

            var existing = await _context.ProjectLeaders
                .OrderByDescending(x => x.Start_date)
                .FirstOrDefaultAsync(x => x.Pnumber == pnumber);

            if (existing == null)
            {
                existing = new ProjectLeader
                {
                    LeaderID = employee.SSN,
                    Pnumber = pnumber,
                    Dnumber = project.Dnumber,
                    Start_date = DateTime.UtcNow
                };
                _context.ProjectLeaders.Add(existing);
            }
            else
            {
                existing.LeaderID = employee.SSN;
                existing.Dnumber = project.Dnumber;
                existing.Start_date = DateTime.UtcNow;
                _context.Entry(existing).State = EntityState.Modified;
            }

            // users tablosunda lider rolüne yükselt
            if (!string.IsNullOrWhiteSpace(body.UsernameForUserTable))
            {
                var u = await _context.Users
                    .FirstOrDefaultAsync(x => x.Username == body.UsernameForUserTable);
                if (u != null && !string.Equals(u.Role, "Leader", StringComparison.OrdinalIgnoreCase))
                {
                    u.Role = "Leader";
                    _context.Entry(u).State = EntityState.Modified;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new LeaderDto
            {
                LeaderID = employee.SSN,
                FullName = $"{employee.Fname} {employee.Lname}".Trim(),
                Pnumber = pnumber,
                Dnumber = project.Dnumber,
                UsernameForUserTable = body.UsernameForUserTable
            });
        }

        // Eski CRUD (kalsın)
        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult<ProjectLeader>> CreateLeader(ProjectLeader leader)
        {
            _context.ProjectLeaders.Add(leader);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetLeader), new { id = leader.LeaderID }, leader);
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> UpdateLeader(string id, ProjectLeader leader)
        {
            if (id != leader.LeaderID) return BadRequest();
            _context.Entry(leader).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> DeleteLeader(string id)
        {
            var leader = await _context.ProjectLeaders.FindAsync(id);
            if (leader == null) return NotFound();

            _context.ProjectLeaders.Remove(leader);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
