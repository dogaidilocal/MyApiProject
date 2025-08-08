using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyApiProject.Migrations
{
    /// <inheritdoc />
    public partial class FixKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Works_On_Employee_EmployeeSSN",
                table: "Works_On");

            migrationBuilder.DropForeignKey(
                name: "FK_Works_On_Project_ProjectPnumber",
                table: "Works_On");

            migrationBuilder.DropIndex(
                name: "IX_Works_On_EmployeeSSN",
                table: "Works_On");

            migrationBuilder.DropIndex(
                name: "IX_Works_On_ProjectPnumber",
                table: "Works_On");

            migrationBuilder.DropColumn(
                name: "EmployeeSSN",
                table: "Works_On");

            migrationBuilder.DropColumn(
                name: "ProjectPnumber",
                table: "Works_On");

            migrationBuilder.AlterColumn<string>(
                name: "SSN",
                table: "Works_On",
                type: "character varying(9)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CompletionDate",
                table: "Task_Completion_Log",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "SSN",
                table: "Assigned_To",
                type: "character varying(9)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.CreateIndex(
                name: "IX_Works_On_Pnumber",
                table: "Works_On",
                column: "Pnumber");

            migrationBuilder.CreateIndex(
                name: "IX_Assigned_To_TaskID",
                table: "Assigned_To",
                column: "TaskID");

            migrationBuilder.AddForeignKey(
                name: "FK_Assigned_To_Employee_SSN",
                table: "Assigned_To",
                column: "SSN",
                principalTable: "Employee",
                principalColumn: "SSN",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Assigned_To_Task_TaskID",
                table: "Assigned_To",
                column: "TaskID",
                principalTable: "Task",
                principalColumn: "TaskID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Works_On_Employee_SSN",
                table: "Works_On",
                column: "SSN",
                principalTable: "Employee",
                principalColumn: "SSN",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Works_On_Project_Pnumber",
                table: "Works_On",
                column: "Pnumber",
                principalTable: "Project",
                principalColumn: "Pnumber",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Assigned_To_Employee_SSN",
                table: "Assigned_To");

            migrationBuilder.DropForeignKey(
                name: "FK_Assigned_To_Task_TaskID",
                table: "Assigned_To");

            migrationBuilder.DropForeignKey(
                name: "FK_Works_On_Employee_SSN",
                table: "Works_On");

            migrationBuilder.DropForeignKey(
                name: "FK_Works_On_Project_Pnumber",
                table: "Works_On");

            migrationBuilder.DropIndex(
                name: "IX_Works_On_Pnumber",
                table: "Works_On");

            migrationBuilder.DropIndex(
                name: "IX_Assigned_To_TaskID",
                table: "Assigned_To");

            migrationBuilder.AlterColumn<string>(
                name: "SSN",
                table: "Works_On",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(9)");

            migrationBuilder.AddColumn<string>(
                name: "EmployeeSSN",
                table: "Works_On",
                type: "character varying(9)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ProjectPnumber",
                table: "Works_On",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CompletionDate",
                table: "Task_Completion_Log",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<string>(
                name: "SSN",
                table: "Assigned_To",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(9)");

            migrationBuilder.CreateIndex(
                name: "IX_Works_On_EmployeeSSN",
                table: "Works_On",
                column: "EmployeeSSN");

            migrationBuilder.CreateIndex(
                name: "IX_Works_On_ProjectPnumber",
                table: "Works_On",
                column: "ProjectPnumber");

            migrationBuilder.AddForeignKey(
                name: "FK_Works_On_Employee_EmployeeSSN",
                table: "Works_On",
                column: "EmployeeSSN",
                principalTable: "Employee",
                principalColumn: "SSN");

            migrationBuilder.AddForeignKey(
                name: "FK_Works_On_Project_ProjectPnumber",
                table: "Works_On",
                column: "ProjectPnumber",
                principalTable: "Project",
                principalColumn: "Pnumber",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
