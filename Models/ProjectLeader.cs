using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MyApiProject.Models; 

namespace MyApiProject.Models
{
    [Table("Project_Leader")]
    public class ProjectLeader
    {
        [Key]
        [StringLength(9)]
        [Column("LeaderSSN")]
        public string LeaderID { get; set; }

        public int Pnumber { get; set; }

        public int Dnumber { get; set; }

        public DateTime? Start_date { get; set; }

        [ForeignKey(nameof(Dnumber))]
        public Department? Department { get; set; }

        [ForeignKey(nameof(Pnumber))]
        public Project? Project { get; set; }

        [ForeignKey(nameof(LeaderID))]
        public Employee? Employee { get; set; }

    }
}