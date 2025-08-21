using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyApiProject.Models
{
	[Table("Task_Todo")]
	public class TaskTodo
	{
		public int TaskID { get; set; }
		public int TodoIndex { get; set; }

		public string? Description { get; set; }
		public int? Importance { get; set; }
		public bool IsCompleted { get; set; }

		[ForeignKey("TaskID")]
		public ProjectTask? Task { get; set; }
	}
}