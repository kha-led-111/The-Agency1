using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TheAgency.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AuditIndexesAndRelationships : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_orders_users_DeliveryAgentId",
                table: "orders");

            migrationBuilder.CreateIndex(
                name: "IX_products_CreatedAtUtc",
                table: "products",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_products_Status",
                table: "products",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_orders_BuyerId",
                table: "orders",
                column: "BuyerId");

            migrationBuilder.CreateIndex(
                name: "IX_orders_CreatedAtUtc",
                table: "orders",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_orders_Status",
                table: "orders",
                column: "Status");

            migrationBuilder.AddForeignKey(
                name: "FK_orders_users_DeliveryAgentId",
                table: "orders",
                column: "DeliveryAgentId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_orders_users_DeliveryAgentId",
                table: "orders");

            migrationBuilder.DropIndex(
                name: "IX_products_CreatedAtUtc",
                table: "products");

            migrationBuilder.DropIndex(
                name: "IX_products_Status",
                table: "products");

            migrationBuilder.DropIndex(
                name: "IX_orders_BuyerId",
                table: "orders");

            migrationBuilder.DropIndex(
                name: "IX_orders_CreatedAtUtc",
                table: "orders");

            migrationBuilder.DropIndex(
                name: "IX_orders_Status",
                table: "orders");

            migrationBuilder.AddForeignKey(
                name: "FK_orders_users_DeliveryAgentId",
                table: "orders",
                column: "DeliveryAgentId",
                principalTable: "users",
                principalColumn: "Id");
        }
    }
}
