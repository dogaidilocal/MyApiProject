using System;
using MyApiProject.Models; 
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyApiProject.Models
{
    [Table("Assigned_To")]
    public class AssignedTo
    {
        [Key]
        public int Id { get; set; } // Primary key for EF Core

        [Required]
        public string SSN { get; set; }  // Employee identifier

        [Required]
        public int TaskID { get; set; }

        public int TodoIndex { get; set; }  // To-Do item index within the task

        public DateTime? Assigned_date { get; set; }

        [ForeignKey("SSN")]
        public Employee? Employee { get; set; }

        [ForeignKey("TaskID")]
        public ProjectTask? Task { get; set; }

    }
}
