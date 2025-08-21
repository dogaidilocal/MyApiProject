// ✅ Task model is renamed to ProjectTask to avoid name clash
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MyApiProject.Models;

namespace MyApiProject.Models
{
    [Table("Task")]
    public class ProjectTask
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int TaskID { get; set; }

        public string TaskName { get; set; }

        public DateTime? Start_date { get; set; }
        public DateTime? Due_date { get; set; }

        [Column("Completion_rate")]
        public int? Completion_rate { get; set; }

        public int? Task_number { get; set; }
        public int? Pnumber { get; set; }
        public int? Dnumber { get; set; } // Department number

        [ForeignKey("Pnumber")]
        public Project? Project { get; set; }
        
        [ForeignKey("Dnumber")]
        public Department? Department { get; set; }

        public ICollection<AssignedTo> AssignedEmployees { get; set; } = new List<AssignedTo>();

        [NotMapped]
        public List<List<int>> Assignments { get; set; } = new();

        public ICollection<TaskTodo> Todos { get; set; } = new List<TaskTodo>();

        

    }
}
