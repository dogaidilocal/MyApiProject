using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MyApiProject.Models;
namespace MyApiProject.Models
{
    [Table("Department")]
    public class Department
    {
        [Key]
        public int Dnumber { get; set; }
        public string Dname { get; set; }
    }
}