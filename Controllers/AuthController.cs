using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApiProject.Data;
using MyApiProject.Models;
using Microsoft.Extensions.Configuration;

namespace MyApiProject.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (request == null)
                return BadRequest("Request body is missing.");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
            if (user == null)
                return Unauthorized("Invalid username");

            // Gerçek projede hash karşılaştırması kullan
            if (user.PasswordHash != request.Password)
                return Unauthorized("Invalid password");

            // Kullanıcının SSN'ini bul
            string? userSSN = null;
            string Normalize(string? s) => (s ?? string.Empty).Trim().ToLower();
            var employees = await _context.Employees.ToListAsync();
            var matchingEmployee = employees.FirstOrDefault(e =>
            {
                var fname = Normalize(e.Fname);
                var lname = Normalize(e.Lname);
                var fullName = Normalize($"{e.Fname}{e.Lname}");
                var fullNameWithDot = Normalize($"{e.Fname}.{e.Lname}");
                var username = Normalize(user.Username);
                
                return username == fname ||
                       username == lname ||
                       username == fullName ||
                       username == fullNameWithDot ||
                       username == ($"{fname}.{lname}") ||
                       username == ($"{fname}{lname}");
            });
            
            if (matchingEmployee != null)
            {
                userSSN = matchingEmployee.SSN;
            }

            // Benzersiz kimlik ve issued at claim'leri
            var claims = new[]
            {
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role.ToLower()),
                new Claim("role", user.Role.ToLower()), // Add explicit role claim
                new Claim("SSN", userSSN ?? ""),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
            };

            var jwtKey = _config["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key configuration is missing.");
            var jwtIssuer = _config["Jwt:Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer configuration is missing.");
            var jwtAudience = _config["Jwt:Audience"] ?? throw new InvalidOperationException("Jwt:Audience configuration is missing.");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: creds
            );

            return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token) });
        }
    }

    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}