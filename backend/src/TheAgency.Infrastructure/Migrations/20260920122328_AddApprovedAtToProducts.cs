using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TheAgency.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddApprovedAtToProducts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAt",
                table: "products",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApprovedAt",
                table: "products");
        }
    }
}
