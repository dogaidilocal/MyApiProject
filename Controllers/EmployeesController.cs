using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApiProject.Data;
using MyApiProject.Models;
using MyApiProject.Models.Dto;
using Microsoft.AspNetCore.Authorization; // Authorize için gerekli

namespace MyApiProject.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EmployeesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/employees
  [HttpGet]
[AllowAnonymous]
public async Task<ActionResult<IEnumerable<Employee>>> GetEmployees()
{
    return await _context.Employees
        .Include(e => e.Department) // Bu satır mutlaka olmalı
        .ToListAsync();
}


        // GET: api/employees/5
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<Employee>> GetEmployee(string id)
        {
            var employee = await _context.Employees.FindAsync(id);
            if (employee == null)
                return NotFound();
            return employee;
        }

        // POST: api/employees
        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult<CreateEmployeeResponse>> CreateEmployee(CreateEmployeeRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.SSN) || string.IsNullOrWhiteSpace(req.Fname))
                return BadRequest("SSN ve Fname zorunludur");

            // 1) Employee ekle
            var employee = new Employee
            {
                SSN = req.SSN,
                Fname = req.Fname,
                Lname = req.Lname,
                Dno = req.Dno
            };
            _context.Employees.Add(employee);

            // 2) Username/Password
            var username = string.IsNullOrWhiteSpace(req.Username)
                ? req.Fname.ToLower()
                : req.Username.Trim();

            var password = string.IsNullOrWhiteSpace(req.Password)
                ? $"{req.Fname.ToLower()}123"
                : req.Password;

            // 3) Users tablosuna employee rolüyle kayıt
            var user = new User
            {
                Username = username,
                PasswordHash = password, // DEMO: plain text. Gerçekte hashle!
                Role = "employee"
            };
            _context.Users.Add(user);

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetEmployee), new { id = employee.SSN }, new CreateEmployeeResponse
            {
                SSN = employee.SSN,
                Username = user.Username,
                Role = user.Role,
                Password = password
            });
        }

        // PUT: api/employees/5
        [HttpPut("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> UpdateEmployee(string id, Employee employee)
        {
            if (id != employee.SSN)
                return BadRequest();

            _context.Entry(employee).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Employees.Any(e => e.SSN == id))
                    return NotFound();
                else
                    throw;
            }

            return NoContent();
        }

        // DELETE: api/employees/5
        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> DeleteEmployee(string id)
        {
            var employee = await _context.Employees.FindAsync(id);
            if (employee == null)
                return NotFound();

            // Kullanıcı kaydını da sil (varsa)
            // Basit eşleme: Username = Employee.Fname (lower)
            var username = (employee.Fname ?? string.Empty).ToLower();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == username);
            if (user != null)
            {
                _context.Users.Remove(user);
            }

            _context.Employees.Remove(employee);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
