using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MyApiProject.Models; 

namespace MyApiProject.Models
{
    [Table("Task_Completion_Log")]
    public class TaskCompletionLog
    {
        [Key]
        public int LogID { get; set; }

        public int TaskID { get; set; }

        public DateTime CompletionDate { get; set; }

        [ForeignKey("TaskID")]
        public ProjectTask? Task { get; set; } // ✅ Güncellendi
    }
}
