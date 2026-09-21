using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TheAgency.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPenaltyPoints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PenaltyPoints",
                table: "users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Size",
                table: "products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SubcategoryId",
                table: "products",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PenaltyPoints",
                table: "users");

            migrationBuilder.DropColumn(
                name: "Size",
                table: "products");

            migrationBuilder.DropColumn(
                name: "SubcategoryId",
                table: "products");
        }
    }
}
