using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApiProject.Data;
using MyApiProject.Models;
using Microsoft.AspNetCore.Authorization; // Authorize için gerekli

namespace MyApiProject.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectLeadersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProjectLeadersController(AppDbContext context)
        {
            _context = context;
        }

      [HttpGet]
[AllowAnonymous]
public async Task<ActionResult<IEnumerable<ProjectLeader>>> GetLeaders()
{
    var leaders = await _context.ProjectLeaders
        .Include(pl => pl.Employee)
            .ThenInclude(e => e.Department)
        .Include(pl => pl.Project)
        .ToListAsync();

    return Ok(leaders);
}


        // GET: api/projectleaders/5
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<ProjectLeader>> GetLeader(string id)
        {
            var leader = await _context.ProjectLeaders.FindAsync(id);
            if (leader == null)
                return NotFound();
            return leader;
        }

        // POST: api/projectleaders
        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult<ProjectLeader>> CreateLeader(ProjectLeader leader)
        {
            _context.ProjectLeaders.Add(leader);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetLeader), new { id = leader.LeaderID }, leader);
        }

        // PUT: api/projectleaders/5
        [HttpPut("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> UpdateLeader(string id, ProjectLeader leader)
        {
            if (id != leader.LeaderID)
                return BadRequest();

            _context.Entry(leader).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/projectleaders/5
        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> DeleteLeader(string id)
        {
            var leader = await _context.ProjectLeaders.FindAsync(id);
            if (leader == null)
                return NotFound();

            _context.ProjectLeaders.Remove(leader);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
