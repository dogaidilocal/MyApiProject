using Microsoft.EntityFrameworkCore;
using MyApiProject.Models;

namespace MyApiProject.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Department> Departments { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectTask> Tasks { get; set; } // ✅ isim değişti
        public DbSet<Employee> Employees { get; set; }
        public DbSet<WorksOn> WorksOn { get; set; }
        public DbSet<AssignedTo> AssignedTos { get; set; }

        public DbSet<ProjectLeader> ProjectLeaders { get; set; }
        public DbSet<TaskCompletionLog> TaskCompletionLogs { get; set; }
        public DbSet<AssignmentLog> AssignmentLogs { get; set; }
        public DbSet<User> Users { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<WorksOn>()
                .HasKey(w => new { w.SSN, w.Pnumber });

            modelBuilder.Entity<User>().ToTable("users");

            modelBuilder.Entity<Project>()
                .HasOne(p => p.Department)
                .WithMany()
                .HasForeignKey(p => p.Dnumber);

            modelBuilder.Entity<WorksOn>()
                .HasOne(w => w.Employee)
                .WithMany()
                .HasForeignKey(w => w.SSN)
                .HasPrincipalKey(e => e.SSN);

            modelBuilder.Entity<WorksOn>()
                .HasOne(w => w.Project)
                .WithMany()
                .HasForeignKey(w => w.Pnumber)
                .HasPrincipalKey(p => p.Pnumber);

            modelBuilder.Entity<AssignedTo>()
                .HasOne(a => a.Employee)
                .WithMany(e => e.AssignedTasks)
                .HasForeignKey(a => a.SSN)
                .HasPrincipalKey(e => e.SSN);

            modelBuilder.Entity<AssignedTo>()
                .HasOne(a => a.Task)
                .WithMany(t => t.AssignedEmployees)
                .HasForeignKey(a => a.TaskID)
                .HasPrincipalKey(t => t.TaskID);

            modelBuilder.Entity<Project>()
               .HasMany(p => p.Tasks)
               .WithOne(t => t.Project)
               .HasForeignKey(t => t.Pnumber)
               .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProjectTask>()
                .HasOne(t => t.Project)
                .WithMany(p => p.Tasks)
                .HasForeignKey(t => t.Pnumber)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
