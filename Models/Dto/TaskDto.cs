using MyApiProject.Models;

namespace MyApiProject.Models.Dto
{
    public class TaskDto
    {
        public int TaskID { get; set; }
        public string TaskName { get; set; } = string.Empty;
        public DateTime? Start_date { get; set; }
        public DateTime? Due_date { get; set; }
        public int? Completion_rate { get; set; }
        public int? Task_number { get; set; }
        public int? Pnumber { get; set; }

        public List<TodoDto> Todos { get; set; } = new();
        public List<List<string>> Assignments { get; set; } = new();
    }

    public class TodoDto
    {
        public int TodoIndex { get; set; }
        public string? Description { get; set; }
        public int? Importance { get; set; }
        public bool IsCompleted { get; set; }
    }
}