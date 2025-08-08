using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApiProject.Data;
using MyApiProject.Models;
using Microsoft.AspNetCore.Authorization;

// ✅ Task kelimesi çakışmasını önlemek için alias tanımlandı
using ProjectTask = MyApiProject.Models.ProjectTask;

namespace MyApiProject.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AssignmentLogsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AssignmentLogsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: herkes erişebilir
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<AssignmentLog>>> GetLogs()
        {
            var data = await _context.AssignmentLogs
                .Include(log => log.Employee)
                    .ThenInclude(emp => emp.Department)
                .Include(log => log.Task) // ✅ ProjectTask ile eşleşiyor
                .ToListAsync();

            return Ok(data);
        }

        // GET(id): herkes erişebilir
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<AssignmentLog>> GetLog(int id)
        {
            var log = await _context.AssignmentLogs
                .Include(l => l.Employee)
                    .ThenInclude(e => e.Department)
                .Include(l => l.Task)
                .FirstOrDefaultAsync(l => l.LogID == id);

            if (log == null)
                return NotFound();

            return log;
        }

        // POST: sadece lider rolü
        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult<AssignmentLog>> CreateLog(AssignmentLog log)
        {
            _context.AssignmentLogs.Add(log);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetLog), new { id = log.LogID }, log);
        }

        // DELETE: sadece lider rolü
        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> DeleteLog(int id)
        {
            var log = await _context.AssignmentLogs.FindAsync(id);
            if (log == null)
                return NotFound();

            _context.AssignmentLogs.Remove(log);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
