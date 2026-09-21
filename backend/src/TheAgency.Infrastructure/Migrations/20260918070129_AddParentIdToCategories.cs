using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TheAgency.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddParentIdToCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ParentId",
                table: "categories",
                type: "uuid",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "categories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "Description", "Name", "ParentId" },
                values: new object[] { "هواتف، كمبيوتر، وإلكترونيات ذكية", "إلكترونيات", null });

            migrationBuilder.UpdateData(
                table: "categories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "Description", "Name", "ParentId" },
                values: new object[] { "ملابس، أزياء، حقائب وإكسسوارات نسائية", "ملابس نسائية", null });

            migrationBuilder.UpdateData(
                table: "categories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "Description", "Name", "ParentId" },
                values: new object[] { "أثاث، ديكور ومستلزمات منزلية", "أثاث ومنزل", null });

            migrationBuilder.UpdateData(
                table: "categories",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "Description", "Name", "ParentId" },
                values: new object[] { "كتب، روايات ومستلزمات تعليمية", "كتب وميديا", null });

            migrationBuilder.UpdateData(
                table: "categories",
                keyColumn: "Id",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                columns: new[] { "Description", "Name", "ParentId" },
                values: new object[] { "سيارات، دراجات وقطع غيار", "سيارات ومحركات", null });

            migrationBuilder.UpdateData(
                table: "categories",
                keyColumn: "Id",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                columns: new[] { "Description", "Name", "ParentId" },
                values: new object[] { "منتجات أخرى متنوعة", "عام وأخرى", null });

            migrationBuilder.CreateIndex(
                name: "IX_categories_ParentId",
                table: "categories",
                column: "ParentId");

            migrationBuilder.AddForeignKey(
                name: "FK_categories_categories_ParentId",
                table: "categories",
                column: "ParentId",
                principalTable: "categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_categories_categories_ParentId",
                table: "categories");

            migrationBuilder.DropIndex(
                name: "IX_categories_ParentId",
                table: "categories");

            migrationBuilder.DropColumn(
                name: "ParentId",
                table: "categories");

            migrationBuilder.UpdateData(
                table: "categories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "Description", "Name" },
                values: new object[] { "Phones, laptops, gadgets & accessories", "Electronics" });

            migrationBuilder.UpdateData(
                table: "categories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "Description", "Name" },
                values: new object[] { "Clothing, shoes, bags & watches", "Fashion" });

            migrationBuilder.UpdateData(
                table: "categories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "Description", "Name" },
                values: new object[] { "Furniture, decor & appliances", "Home & Garden" });

            migrationBuilder.UpdateData(
                table: "categories",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "Description", "Name" },
                values: new object[] { "Textbooks, novels & media", "Books & Media" });

            migrationBuilder.UpdateData(
                table: "categories",
                keyColumn: "Id",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                columns: new[] { "Description", "Name" },
                values: new object[] { "Cars, motorcycles & auto parts", "Vehicles" });

            migrationBuilder.UpdateData(
                table: "categories",
                keyColumn: "Id",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                columns: new[] { "Description", "Name" },
                values: new object[] { "Everything else", "General & Other" });
        }
    }
}
