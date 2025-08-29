using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Zatychka.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddReserves_Tables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserTelegramLinks_Users_UserId",
                table: "UserTelegramLinks");

            migrationBuilder.DropPrimaryKey(
                name: "PK_UserTelegramLinks",
                table: "UserTelegramLinks");

            migrationBuilder.DropIndex(
                name: "IX_UserTelegramLinks_UserId",
                table: "UserTelegramLinks");

            migrationBuilder.DropIndex(
                name: "IX_UserTelegramLinks_Username",
                table: "UserTelegramLinks");

            migrationBuilder.RenameTable(
                name: "UserTelegramLinks",
                newName: "TelegramLinks");

            migrationBuilder.AddPrimaryKey(
                name: "PK_TelegramLinks",
                table: "TelegramLinks",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "PrivateReserves",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    UserId = table.Column<string>(type: "varchar(128)", maxLength: 128, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PrivateReserves", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "PublicReserves",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PublicReserves", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.InsertData(
                table: "PublicReserves",
                columns: new[] { "Id", "Amount", "UpdatedAt" },
                values: new object[] { 1, 0m, new DateTimeOffset(new DateTime(2025, 8, 29, 0, 15, 39, 41, DateTimeKind.Unspecified).AddTicks(1845), new TimeSpan(0, 0, 0, 0, 0)) });

            migrationBuilder.CreateIndex(
                name: "IX_TelegramLinks_UserId",
                table: "TelegramLinks",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PrivateReserves_UserId",
                table: "PrivateReserves",
                column: "UserId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_TelegramLinks_Users_UserId",
                table: "TelegramLinks",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TelegramLinks_Users_UserId",
                table: "TelegramLinks");

            migrationBuilder.DropTable(
                name: "PrivateReserves");

            migrationBuilder.DropTable(
                name: "PublicReserves");

            migrationBuilder.DropPrimaryKey(
                name: "PK_TelegramLinks",
                table: "TelegramLinks");

            migrationBuilder.DropIndex(
                name: "IX_TelegramLinks_UserId",
                table: "TelegramLinks");

            migrationBuilder.RenameTable(
                name: "TelegramLinks",
                newName: "UserTelegramLinks");

            migrationBuilder.AddPrimaryKey(
                name: "PK_UserTelegramLinks",
                table: "UserTelegramLinks",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_UserTelegramLinks_UserId",
                table: "UserTelegramLinks",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserTelegramLinks_Username",
                table: "UserTelegramLinks",
                column: "Username",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_UserTelegramLinks_Users_UserId",
                table: "UserTelegramLinks",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
