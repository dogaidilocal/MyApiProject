using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MyApiProject.Models;
namespace MyApiProject.Models
{
    [Table("Assignment_Log")]
    public class AssignmentLog
{
    [Key]
    public int LogID { get; set; }

    [Required]
    public string SSN { get; set; }

    [Required]
    public int TaskID { get; set; }

    public DateTime? AssignedDate { get; set; }

    [ForeignKey(nameof(SSN))]
    public Employee? Employee { get; set; }

    [ForeignKey(nameof(TaskID))]
    public ProjectTask? Task { get; set; }
}

}


