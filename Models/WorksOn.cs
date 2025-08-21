using System.ComponentModel.DataAnnotations.Schema;
using MyApiProject.Models; 

namespace MyApiProject.Models
{
    [Table("Works_On")]
    public class WorksOn
    {
        [Column("SSN")]
        public string SSN { get; set; }

        [Column("Pnumber")]
        public int Pnumber { get; set; }

        public Employee? Employee { get; set; }
        public Project? Project { get; set; }
    }
}