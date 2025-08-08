using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApiProject.Data;
using MyApiProject.Models;
using Microsoft.AspNetCore.Authorization;

namespace MyApiProject.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TaskCompletionLogsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TaskCompletionLogsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/taskcompletionlogs
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<TaskCompletionLog>>> GetLogs()
        {
            return await _context.TaskCompletionLogs
                .Include(l => l.Task)
                .ToListAsync();
        }

        // GET: api/taskcompletionlogs/5
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<TaskCompletionLog>> GetLog(int id)
        {
            var log = await _context.TaskCompletionLogs
                .Include(l => l.Task)
                .FirstOrDefaultAsync(l => l.LogID == id);

            if (log == null)
                return NotFound();

            return log;
        }

        // POST: api/taskcompletionlogs
        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult<TaskCompletionLog>> CreateLog(TaskCompletionLog log)
        {
            _context.TaskCompletionLogs.Add(log);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetLog), new { id = log.LogID }, log);
        }

        // DELETE: api/taskcompletionlogs/5
        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> DeleteLog(int id)
        {
            var log = await _context.TaskCompletionLogs.FindAsync(id);
            if (log == null)
                return NotFound();

            _context.TaskCompletionLogs.Remove(log);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
