using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BsBakerySPA.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSeedDataFromProductsJsx : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "BagelToppings",
                columns: new[] { "Id", "Name" },
                values: new object[,]
                {
                    { "T000", "Plain" },
                    { "T001", "Cheddar" },
                    { "T002", "Asiago" },
                    { "T003", "Sesame" },
                    { "T004", "Everything" },
                    { "T005", "Cheddar Jalapeño" }
                });

            migrationBuilder.InsertData(
                table: "Products",
                columns: new[] { "Id", "Category", "Description", "Name", "Price" },
                values: new object[,]
                {
                    { "B001", "Bagel", null, "1/2 Dozen Bagels", 12.00m },
                    { "B002", "Bagel", null, "Dozen Bagels", 22.00m },
                    { "C001", "Cookie", null, "Chocolate Chip Cookies (Dozen)", 20.00m },
                    { "L001", "Loaf", null, "Regular", 12.00m },
                    { "L002", "Loaf", null, "Pepperoni Mozzarella", 14.00m },
                    { "L003", "Loaf", null, "Cheddar Jalapeño", 14.00m },
                    { "L004", "Loaf", null, "Cinnamon Apple", 14.00m },
                    { "L005", "Loaf", null, "Everything Loaf", 14.00m }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "BagelToppings",
                keyColumn: "Id",
                keyValue: "T000");

            migrationBuilder.DeleteData(
                table: "BagelToppings",
                keyColumn: "Id",
                keyValue: "T001");

            migrationBuilder.DeleteData(
                table: "BagelToppings",
                keyColumn: "Id",
                keyValue: "T002");

            migrationBuilder.DeleteData(
                table: "BagelToppings",
                keyColumn: "Id",
                keyValue: "T003");

            migrationBuilder.DeleteData(
                table: "BagelToppings",
                keyColumn: "Id",
                keyValue: "T004");

            migrationBuilder.DeleteData(
                table: "BagelToppings",
                keyColumn: "Id",
                keyValue: "T005");

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: "B001");

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: "B002");

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: "C001");

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: "L001");

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: "L002");

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: "L003");

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: "L004");

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: "L005");
        }
    }
}
