using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApiProject.Data;
using MyApiProject.Models;
using Microsoft.AspNetCore.Authorization;

// ✅ Task ismini kullanan model artık ProjectTask olarak değişti
using ProjectTaskModel = MyApiProject.Models.ProjectTask;

namespace MyApiProject.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AssignedToController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AssignedToController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/AssignedTo/all → Tüm görev atamaları (detaylı)
        [HttpGet("all")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<AssignedTo>>> GetAll()
        {
            var data = await _context.AssignedTos
                .Include(a => a.Employee)
                    .ThenInclude(e => e.Department)
                .Include(a => a.Task) // ✅ artık AssignedTo içindeki Task -> ProjectTask tipinde
                .ToListAsync();

            return Ok(data);
        }

        // GET: api/AssignedTo/{ssn}/{taskId} → Belirli atama (tekil)
        [HttpGet("{ssn}/{taskId}")]
        [AllowAnonymous]
        public async Task<ActionResult<AssignedTo>> GetAssigned(string ssn, int taskId)
        {
            var assigned = await _context.AssignedTos
                .Include(a => a.Employee)
                    .ThenInclude(e => e.Department)
                .Include(a => a.Task)
                .FirstOrDefaultAsync(a => a.SSN == ssn && a.TaskID == taskId);

            if (assigned == null)
                return NotFound();

            return assigned;
        }

        // POST: Sadece admin kullanıcılar görev ataması yapabilir
        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult<AssignedTo>> CreateAssigned(AssignedTo assigned)
        {
            _context.AssignedTos.Add(assigned);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAssigned), new { ssn = assigned.SSN, taskId = assigned.TaskID }, assigned);
        }

        // PUT: Sadece admin kullanıcılar görev atamasını güncelleyebilir
        [HttpPut("{ssn}/{taskId}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> UpdateAssigned(string ssn, int taskId, AssignedTo assigned)
        {
            if (ssn != assigned.SSN || taskId != assigned.TaskID)
                return BadRequest();

            _context.Entry(assigned).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: Sadece admin kullanıcılar görev atamasını silebilir
        [HttpDelete("{ssn}/{taskId}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> DeleteAssigned(string ssn, int taskId)
        {
            var assigned = await _context.AssignedTos
                .FirstOrDefaultAsync(a => a.SSN == ssn && a.TaskID == taskId);

            if (assigned == null)
                return NotFound();

            _context.AssignedTos.Remove(assigned);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
