using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyApiProject.Models
{
    [Table("Employee")]

    public class Employee
    {
        [Key]
        [StringLength(9)]
        public string SSN { get; set; }

        public string Fname { get; set; }

        public string Lname { get; set; }

        public int Dno { get; set; }

        [ForeignKey(nameof(Dno))]
        public Department? Department { get; set; }
    
    public ICollection<AssignedTo> AssignedTasks { get; set; } = new List<AssignedTo>();

}


}