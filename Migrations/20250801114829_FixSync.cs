using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyApiProject.Migrations
{
    /// <inheritdoc />
    public partial class FixSync : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "TaskID",
                table: "Assigned_To",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer")
                .Annotation("Relational:ColumnOrder", 1);

            migrationBuilder.AlterColumn<string>(
                name: "SSN",
                table: "Assigned_To",
                type: "character varying(9)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(9)")
                .Annotation("Relational:ColumnOrder", 0);

            migrationBuilder.CreateIndex(
                name: "IX_Task_Pnumber",
                table: "Task",
                column: "Pnumber");

            migrationBuilder.AddForeignKey(
                name: "FK_Project_Leader_Employee_LeaderID",
                table: "Project_Leader",
                column: "LeaderID",
                principalTable: "Employee",
                principalColumn: "SSN",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Task_Project_Pnumber",
                table: "Task",
                column: "Pnumber",
                principalTable: "Project",
                principalColumn: "Pnumber",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Project_Leader_Employee_LeaderID",
                table: "Project_Leader");

            migrationBuilder.DropForeignKey(
                name: "FK_Task_Project_Pnumber",
                table: "Task");

            migrationBuilder.DropIndex(
                name: "IX_Task_Pnumber",
                table: "Task");

            migrationBuilder.AlterColumn<int>(
                name: "TaskID",
                table: "Assigned_To",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer")
                .OldAnnotation("Relational:ColumnOrder", 1);

            migrationBuilder.AlterColumn<string>(
                name: "SSN",
                table: "Assigned_To",
                type: "character varying(9)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(9)")
                .OldAnnotation("Relational:ColumnOrder", 0);
        }
    }
}
