using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TheAgency.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLocationAndPhoneToUserAndProduct : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "DeliveryAgentId",
                table: "orders",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_orders_DeliveryAgentId",
                table: "orders",
                column: "DeliveryAgentId");

            migrationBuilder.AddForeignKey(
                name: "FK_orders_users_DeliveryAgentId",
                table: "orders",
                column: "DeliveryAgentId",
                principalTable: "users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_orders_users_DeliveryAgentId",
                table: "orders");

            migrationBuilder.DropIndex(
                name: "IX_orders_DeliveryAgentId",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "DeliveryAgentId",
                table: "orders");
        }
    }
}
