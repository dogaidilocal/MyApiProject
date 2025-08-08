using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MyApiProject.Migrations
{
    /// <inheritdoc />
    public partial class InitialBaseline : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Assigned_To",
                columns: table => new
                {
                    SSN = table.Column<string>(type: "text", nullable: false),
                    TaskID = table.Column<int>(type: "integer", nullable: false),
                    Assigned_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Assigned_To", x => new { x.SSN, x.TaskID });
                });

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
                name: "Task",
                columns: table => new
                {
                    TaskID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TaskName = table.Column<string>(type: "text", nullable: false),
                    Start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Due_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Completion_rate = table.Column<int>(type: "integer", nullable: true),
                    Task_number = table.Column<int>(type: "integer", nullable: true),
                    Pnumber = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Task", x => x.TaskID);
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
                    Dnumber = table.Column<int>(type: "integer", nullable: false),
                    DepartmentDnumber = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Project", x => x.Pnumber);
                    table.ForeignKey(
                        name: "FK_Project_Department_DepartmentDnumber",
                        column: x => x.DepartmentDnumber,
                        principalTable: "Department",
                        principalColumn: "Dnumber");
                });

            migrationBuilder.CreateTable(
                name: "Task_Completion_Log",
                columns: table => new
                {
                    LogID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TaskID = table.Column<int>(type: "integer", nullable: false),
                    CompletionDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
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
                name: "Project_Leader",
                columns: table => new
                {
                    LeaderID = table.Column<string>(type: "character varying(9)", maxLength: 9, nullable: false),
                    Pnumber = table.Column<int>(type: "integer", nullable: false),
                    Dnumber = table.Column<int>(type: "integer", nullable: false),
                    Start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EmployeeSSN = table.Column<string>(type: "character varying(9)", nullable: true),
                    ProjectPnumber = table.Column<int>(type: "integer", nullable: false),
                    DepartmentDnumber = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Project_Leader", x => x.LeaderID);
                    table.ForeignKey(
                        name: "FK_Project_Leader_Department_DepartmentDnumber",
                        column: x => x.DepartmentDnumber,
                        principalTable: "Department",
                        principalColumn: "Dnumber",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Project_Leader_Employee_EmployeeSSN",
                        column: x => x.EmployeeSSN,
                        principalTable: "Employee",
                        principalColumn: "SSN");
                    table.ForeignKey(
                        name: "FK_Project_Leader_Project_ProjectPnumber",
                        column: x => x.ProjectPnumber,
                        principalTable: "Project",
                        principalColumn: "Pnumber",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Works_On",
                columns: table => new
                {
                    SSN = table.Column<string>(type: "text", nullable: false),
                    Pnumber = table.Column<int>(type: "integer", nullable: false),
                    EmployeeSSN = table.Column<string>(type: "character varying(9)", nullable: true),
                    ProjectPnumber = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Works_On", x => new { x.SSN, x.Pnumber });
                    table.ForeignKey(
                        name: "FK_Works_On_Employee_EmployeeSSN",
                        column: x => x.EmployeeSSN,
                        principalTable: "Employee",
                        principalColumn: "SSN");
                    table.ForeignKey(
                        name: "FK_Works_On_Project_ProjectPnumber",
                        column: x => x.ProjectPnumber,
                        principalTable: "Project",
                        principalColumn: "Pnumber",
                        onDelete: ReferentialAction.Cascade);
                });

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
                name: "IX_Project_DepartmentDnumber",
                table: "Project",
                column: "DepartmentDnumber");

            migrationBuilder.CreateIndex(
                name: "IX_Project_Leader_DepartmentDnumber",
                table: "Project_Leader",
                column: "DepartmentDnumber");

            migrationBuilder.CreateIndex(
                name: "IX_Project_Leader_EmployeeSSN",
                table: "Project_Leader",
                column: "EmployeeSSN");

            migrationBuilder.CreateIndex(
                name: "IX_Project_Leader_ProjectPnumber",
                table: "Project_Leader",
                column: "ProjectPnumber");

            migrationBuilder.CreateIndex(
                name: "IX_Task_Completion_Log_TaskID",
                table: "Task_Completion_Log",
                column: "TaskID");

            migrationBuilder.CreateIndex(
                name: "IX_Works_On_EmployeeSSN",
                table: "Works_On",
                column: "EmployeeSSN");

            migrationBuilder.CreateIndex(
                name: "IX_Works_On_ProjectPnumber",
                table: "Works_On",
                column: "ProjectPnumber");
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
