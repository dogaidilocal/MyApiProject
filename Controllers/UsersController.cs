using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApiProject.Data;
using MyApiProject.Models;

namespace MyApiProject.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        public UsersController(AppDbContext context) => _context = context;

        // Admin-only: tüm kullanıcıları döner (Username, PasswordHash, Role)
        [HttpGet]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> GetUsers()
        {
            // users + employee eşleştirmesi (basit): username ~ Fname (veya Fname.Lname / FnameLname)
            var users = await _context.Users.AsNoTracking().OrderBy(u => u.Username).ToListAsync();
            var employees = await _context.Employees
                .AsNoTracking()
                .Include(e => e.Department)
                .ToListAsync();

            string Normalize(string? s) => (s ?? string.Empty).Trim().ToLower();

            var data = users.Select(u =>
            {
                var un = Normalize(u.Username);
                var match = employees.FirstOrDefault(e =>
                    Normalize(e.Fname) == un ||
                    ($"{Normalize(e.Fname)}.{Normalize(e.Lname)}") == un ||
                    ($"{Normalize(e.Fname)}{Normalize(e.Lname)}") == un
                );

                return new
                {
                    Username = u.Username,
                    PasswordHash = u.PasswordHash,
                    Role = u.Role,
                    SSN = match?.SSN,
                    FullName = match != null ? ($"{match.Fname} {match.Lname}").Trim() : null,
                    Department = match?.Department?.Dname ?? (match?.Dno.ToString())
                };
            });

            return Ok(data);
        }
    }
}


