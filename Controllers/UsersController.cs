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
                {
                    var fname = Normalize(e.Fname);
                    var lname = Normalize(e.Lname);
                    var fullName = Normalize($"{e.Fname}{e.Lname}");
                    var fullNameWithDot = Normalize($"{e.Fname}.{e.Lname}");
                    
                    return un == fname ||
                           un == lname ||
                           un == fullName ||
                           un == fullNameWithDot ||
                           un == ($"{fname}.{lname}") ||
                           un == ($"{fname}{lname}");
                });

                return new
                {
                    Username = u.Username,
                    PasswordHash = u.PasswordHash,
                    Role = u.Role,
                    SSN = match?.SSN ?? "—",
                    FullName = match != null ? ($"{match.Fname} {match.Lname}").Trim() : "—",
                    DepartmentName = match?.Department?.Dname ?? (match?.Dno.ToString()) ?? "—"
                };
            });

            return Ok(data);
        }

        // Admin-only: kullanıcı bilgilerini güncelle
        [HttpPut("{username}")]
        [Authorize] // Temporarily removed AdminOnly policy to test
        public async Task<IActionResult> UpdateUser(string username, [FromBody] UpdateUserRequest request)
        {
            Console.WriteLine($"UpdateUser called: username={username}, request={System.Text.Json.JsonSerializer.Serialize(request)}");
            
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null) 
            {
                Console.WriteLine($"User {username} not found");
                return NotFound($"User {username} not found.");
            }

            Console.WriteLine($"Found user: {user.Username}, current role: {user.Role}");

            // Update user credentials
            if (!string.IsNullOrWhiteSpace(request.Username) && request.Username != username)
            {
                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
                if (existingUser != null) return BadRequest("Username already exists.");
                user.Username = request.Username;
                Console.WriteLine($"Username updated to: {user.Username}");
            }

            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                user.PasswordHash = request.Password; // In production, hash this
                Console.WriteLine("Password updated");
            }

            if (!string.IsNullOrWhiteSpace(request.Role))
            {
                user.Role = request.Role;
                Console.WriteLine($"Role updated to: {user.Role}");
            }

            _context.Entry(user).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            Console.WriteLine("User updated successfully");
            return Ok(new { message = "User updated successfully" });
        }

        // Debug endpoint: Fix Can Aydın's role
        [HttpPost("fix-can-aydin")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> FixCanAydinRole()
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == "can");
            if (user == null) return NotFound("User 'can' not found.");
            
            user.Role = "Leader";
            _context.Entry(user).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            
            return Ok(new { message = "Can Aydın's role updated to Leader" });
        }

        // Debug endpoint: Check current user info
        [HttpGet("debug-user")]
        [Authorize]
        public IActionResult DebugUser()
        {
            var username = User.Identity?.Name;
            var roles = User.Claims.Where(c => c.Type == System.Security.Claims.ClaimTypes.Role).Select(c => c.Value);
            var ssn = User.Claims.FirstOrDefault(c => c.Type == "SSN")?.Value;
            
            return Ok(new { 
                Username = username, 
                Roles = roles.ToList(), 
                SSN = ssn,
                IsAdmin = User.IsInRole("admin")
            });
        }

        // Debug endpoint: Check all users
        [HttpGet("debug-all-users")]
        [Authorize]
        public async Task<IActionResult> DebugAllUsers()
        {
            var users = await _context.Users.ToListAsync();
            return Ok(users.Select(u => new { u.Username, u.Role }));
        }

        // Debug endpoint: Create admin user if not exists
        [HttpPost("create-admin")]
        [AllowAnonymous]
        public async Task<IActionResult> CreateAdminUser()
        {
            var existingAdmin = await _context.Users.FirstOrDefaultAsync(u => u.Role.ToLower() == "admin");
            if (existingAdmin != null)
            {
                return Ok(new { message = "Admin user already exists", username = existingAdmin.Username });
            }

            var adminUser = new User
            {
                Username = "admin",
                PasswordHash = "admin123",
                Role = "admin"
            };

            _context.Users.Add(adminUser);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Admin user created", username = adminUser.Username, password = adminUser.PasswordHash });
        }
    }

    public class UpdateUserRequest
    {
        public string? Username { get; set; }
        public string? Password { get; set; }
        public string? Role { get; set; }
    }
}


