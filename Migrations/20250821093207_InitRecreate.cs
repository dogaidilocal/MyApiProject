using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MyApiProject.Migrations
{
    /// <inheritdoc />
    public partial class InitRecreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Department",
                columns: table => new
                {
                    Dnumber = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Dname = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Department", x => x.Dnumber);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Username = table.Column<string>(type: "text", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.UserId);
                });

            migrationBuilder.CreateTable(
                name: "Employee",
                columns: table => new
                {
                    SSN = table.Column<string>(type: "character varying(9)", maxLength: 9, nullable: false),
                    Fname = table.Column<string>(type: "text", nullable: false),
                    Lname = table.Column<string>(type: "text", nullable: false),
                    Dno = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Employee", x => x.SSN);
                    table.ForeignKey(
                        name: "FK_Employee_Department_Dno",
                        column: x => x.Dno,
                        principalTable: "Department",
                        principalColumn: "Dnumber",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Project",
                columns: table => new
                {
                    Pnumber = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Pname = table.Column<string>(type: "text", nullable: false),
                    Start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Due_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Completion_status = table.Column<int>(type: "integer", nullable: true),
                    Dnumber = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Project", x => x.Pnumber);
                    table.ForeignKey(
                        name: "FK_Project_Department_Dnumber",
                        column: x => x.Dnumber,
                        principalTable: "Department",
                        principalColumn: "Dnumber",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Project_Leader",
                columns: table => new
                {
                    LeaderSSN = table.Column<string>(type: "character varying(9)", maxLength: 9, nullable: false),
                    Pnumber = table.Column<int>(type: "integer", nullable: false),
                    Dnumber = table.Column<int>(type: "integer", nullable: false),
                    Start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Project_Leader", x => x.LeaderSSN);
                    table.ForeignKey(
                        name: "FK_Project_Leader_Department_Dnumber",
                        column: x => x.Dnumber,
                        principalTable: "Department",
                        principalColumn: "Dnumber",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Project_Leader_Employee_LeaderSSN",
                        column: x => x.LeaderSSN,
                        principalTable: "Employee",
                        principalColumn: "SSN",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Project_Leader_Project_Pnumber",
                        column: x => x.Pnumber,
                        principalTable: "Project",
                        principalColumn: "Pnumber",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Task",
                columns: table => new
                {
                    TaskID = table.Column<int>(type: "integer", nullable: false),
                    TaskName = table.Column<string>(type: "text", nullable: false),
                    Start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Due_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Completion_rate = table.Column<int>(type: "integer", nullable: true),
                    Task_number = table.Column<int>(type: "integer", nullable: true),
                    Pnumber = table.Column<int>(type: "integer", nullable: true),
                    Dnumber = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Task", x => x.TaskID);
                    table.ForeignKey(
                        name: "FK_Task_Department_Dnumber",
                        column: x => x.Dnumber,
                        principalTable: "Department",
                        principalColumn: "Dnumber");
                    table.ForeignKey(
                        name: "FK_Task_Project_Pnumber",
                        column: x => x.Pnumber,
                        principalTable: "Project",
                        principalColumn: "Pnumber",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Works_On",
                columns: table => new
                {
                    SSN = table.Column<string>(type: "character varying(9)", nullable: false),
                    Pnumber = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Works_On", x => new { x.SSN, x.Pnumber });
                    table.ForeignKey(
                        name: "FK_Works_On_Employee_SSN",
                        column: x => x.SSN,
                        principalTable: "Employee",
                        principalColumn: "SSN",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Works_On_Project_Pnumber",
                        column: x => x.Pnumber,
                        principalTable: "Project",
                        principalColumn: "Pnumber",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Assigned_To",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SSN = table.Column<string>(type: "character varying(9)", nullable: false),
                    TaskID = table.Column<int>(type: "integer", nullable: false),
                    TodoIndex = table.Column<int>(type: "integer", nullable: false),
                    Assigned_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Assigned_To", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Assigned_To_Employee_SSN",
                        column: x => x.SSN,
                        principalTable: "Employee",
                        principalColumn: "SSN",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Assigned_To_Task_TaskID",
                        column: x => x.TaskID,
                        principalTable: "Task",
                        principalColumn: "TaskID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Assignment_Log",
                columns: table => new
                {
                    LogID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SSN = table.Column<string>(type: "character varying(9)", nullable: false),
                    TaskID = table.Column<int>(type: "integer", nullable: false),
                    AssignedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Assignment_Log", x => x.LogID);
                    table.ForeignKey(
                        name: "FK_Assignment_Log_Employee_SSN",
                        column: x => x.SSN,
                        principalTable: "Employee",
                        principalColumn: "SSN",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Assignment_Log_Task_TaskID",
                        column: x => x.TaskID,
                        principalTable: "Task",
                        principalColumn: "TaskID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Task_Completion_Log",
                columns: table => new
                {
                    LogID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TaskID = table.Column<int>(type: "integer", nullable: false),
                    CompletionDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Task_Completion_Log", x => x.LogID);
                    table.ForeignKey(
                        name: "FK_Task_Completion_Log_Task_TaskID",
                        column: x => x.TaskID,
                        principalTable: "Task",
                        principalColumn: "TaskID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Task_Todo",
                columns: table => new
                {
                    TaskID = table.Column<int>(type: "integer", nullable: false),
                    TodoIndex = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Importance = table.Column<int>(type: "integer", nullable: true),
                    IsCompleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Task_Todo", x => new { x.TaskID, x.TodoIndex });
                    table.ForeignKey(
                        name: "FK_Task_Todo_Task_TaskID",
                        column: x => x.TaskID,
                        principalTable: "Task",
                        principalColumn: "TaskID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Assigned_To_SSN",
                table: "Assigned_To",
                column: "SSN");

            migrationBuilder.CreateIndex(
                name: "IX_Assigned_To_TaskID",
                table: "Assigned_To",
                column: "TaskID");

            migrationBuilder.CreateIndex(
                name: "IX_Assignment_Log_SSN",
                table: "Assignment_Log",
                column: "SSN");

            migrationBuilder.CreateIndex(
                name: "IX_Assignment_Log_TaskID",
                table: "Assignment_Log",
                column: "TaskID");

            migrationBuilder.CreateIndex(
                name: "IX_Employee_Dno",
                table: "Employee",
                column: "Dno");

            migrationBuilder.CreateIndex(
                name: "IX_Project_Dnumber",
                table: "Project",
                column: "Dnumber");

            migrationBuilder.CreateIndex(
                name: "IX_Project_Leader_Dnumber",
                table: "Project_Leader",
                column: "Dnumber");

            migrationBuilder.CreateIndex(
                name: "IX_Project_Leader_Pnumber",
                table: "Project_Leader",
                column: "Pnumber");

            migrationBuilder.CreateIndex(
                name: "IX_Task_Dnumber",
                table: "Task",
                column: "Dnumber");

            migrationBuilder.CreateIndex(
                name: "IX_Task_Pnumber",
                table: "Task",
                column: "Pnumber");

            migrationBuilder.CreateIndex(
                name: "IX_Task_Completion_Log_TaskID",
                table: "Task_Completion_Log",
                column: "TaskID");

            migrationBuilder.CreateIndex(
                name: "IX_Works_On_Pnumber",
                table: "Works_On",
                column: "Pnumber");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Assigned_To");

            migrationBuilder.DropTable(
                name: "Assignment_Log");

            migrationBuilder.DropTable(
                name: "Project_Leader");

            migrationBuilder.DropTable(
                name: "Task_Completion_Log");

            migrationBuilder.DropTable(
                name: "Task_Todo");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "Works_On");

            migrationBuilder.DropTable(
                name: "Task");

            migrationBuilder.DropTable(
                name: "Employee");

            migrationBuilder.DropTable(
                name: "Project");

            migrationBuilder.DropTable(
                name: "Department");
        }
    }
}
