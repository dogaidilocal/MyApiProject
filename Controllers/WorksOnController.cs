
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApiProject.Data;
using MyApiProject.Models;
using Microsoft.AspNetCore.Authorization; // Authorize için gerekli

namespace MyApiProject.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WorksOnController : ControllerBase
    {
        private readonly AppDbContext _context;

        public WorksOnController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/workson
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<WorksOn>>> GetWorksOn()
        {
            return await _context.WorksOn
                .Include(w => w.Employee)
                .Include(w => w.Project)
                    .ThenInclude(p => p.Department)
                .ToListAsync();
        }

        // GET: api/workson/{ssn}/{pnumber}
        [HttpGet("{ssn}/{pnumber}")]
        [AllowAnonymous]
        public async Task<ActionResult<WorksOn>> GetWorksOn(string ssn, int pnumber)
        {
            var worksOn = await _context.WorksOn
                .Include(w => w.Employee)
                .Include(w => w.Project)
                    .ThenInclude(p => p.Department)
                .FirstOrDefaultAsync(w => w.SSN == ssn && w.Pnumber == pnumber);

            if (worksOn == null)
                return NotFound();

            return worksOn;
        }

        // POST: api/workson
        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult<WorksOn>> CreateWorksOn(WorksOn worksOn)
        {
            _context.WorksOn.Add(worksOn);
            await _context.SaveChangesAsync();
            return CreatedAtAction(
                nameof(GetWorksOn),
                new { ssn = worksOn.SSN, pnumber = worksOn.Pnumber },
                worksOn
            );
        }

        // DELETE: api/workson/{ssn}/{pnumber}
        [HttpDelete("{ssn}/{pnumber}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> DeleteWorksOn(string ssn, int pnumber)
        {
            var worksOn = await _context.WorksOn.FindAsync(ssn, pnumber);
            if (worksOn == null)
                return NotFound();

            _context.WorksOn.Remove(worksOn);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
