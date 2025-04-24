using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BsBakerySPA.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPriceToBagelToppings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "BagelToppings",
                type: "decimal(18, 2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.UpdateData(
                table: "BagelToppings",
                keyColumn: "Id",
                keyValue: "T000",
                column: "Price",
                value: 0m);

            migrationBuilder.UpdateData(
                table: "BagelToppings",
                keyColumn: "Id",
                keyValue: "T001",
                column: "Price",
                value: 1.00m);

            migrationBuilder.UpdateData(
                table: "BagelToppings",
                keyColumn: "Id",
                keyValue: "T002",
                column: "Price",
                value: 1.00m);

            migrationBuilder.UpdateData(
                table: "BagelToppings",
                keyColumn: "Id",
                keyValue: "T003",
                column: "Price",
                value: 1.00m);

            migrationBuilder.UpdateData(
                table: "BagelToppings",
                keyColumn: "Id",
                keyValue: "T004",
                column: "Price",
                value: 1.00m);

            migrationBuilder.UpdateData(
                table: "BagelToppings",
                keyColumn: "Id",
                keyValue: "T005",
                column: "Price",
                value: 1.00m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Price",
                table: "BagelToppings");
        }
    }
}
