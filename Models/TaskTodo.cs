using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyApiProject.Models
{
    [Table("Task_Todo")]
    public class TaskTodo
    {
        [Key, Column(Order = 0)]
        public int TaskID { get; set; }

        [Key, Column(Order = 1)]
        public int TodoIndex { get; set; }

        public string? Description { get; set; }
        public int? Importance { get; set; }
        public bool IsCompleted { get; set; }

        [ForeignKey(nameof(TaskID))]
        public ProjectTask? Task { get; set; }
    }
}
