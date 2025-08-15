using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Zatychka.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddPrivateDisputes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ВАЖНО: НЕ создаём PayinTransactionsPrivate — таблица уже есть.

            migrationBuilder.CreateTable(
                name: "PrivateDisputes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    TransactionId = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    RequisiteId = table.Column<int>(type: "int", nullable: true),
                    DeviceId = table.Column<int>(type: "int", nullable: true),
                    DealAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    FilesJson = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TimerEndUtc = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    PausedRemainingSeconds = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PrivateDisputes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PrivateDisputes_Devices_DeviceId",
                        column: x => x.DeviceId,
                        principalTable: "Devices",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PrivateDisputes_OwnerRequisites_RequisiteId",
                        column: x => x.RequisiteId,
                        principalTable: "OwnerRequisites",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PrivateDisputes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_PrivateDisputes_DeviceId",
                table: "PrivateDisputes",
                column: "DeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_PrivateDisputes_RequisiteId",
                table: "PrivateDisputes",
                column: "RequisiteId");

            migrationBuilder.CreateIndex(
                name: "IX_PrivateDisputes_UserId",
                table: "PrivateDisputes",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Откатываем только то, что создавали здесь
            migrationBuilder.DropTable(
                name: "PrivateDisputes");
        }
    }
}
