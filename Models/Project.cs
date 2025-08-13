using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyApiProject.Models
{
    [Table("Project")]
    public class Project
    {
        [Key]
        public int Pnumber { get; set; }
        public string Pname { get; set; }
        public DateTime? Start_date { get; set; }
        public DateTime? Due_date { get; set; }
        public int? Completion_status { get; set; }

        public int Dnumber { get; set; }

        [ForeignKey("Dnumber")]
        public Department? Department { get; set; }

        // ⬇️ EKLENDİ
        public ICollection<ProjectTask> Tasks { get; set; } = new List<ProjectTask>();

        // ⬇️ YENİ: bu ilişkiyi ekleyelim ki Include ile çekebilelim
        public ICollection<ProjectLeader> ProjectLeaders { get; set; } = new List<ProjectLeader>();
    }
}
