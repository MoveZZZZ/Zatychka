using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Zatychka.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddPublicDisputes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BalanceChanges_Users_UserId",
                table: "BalanceChanges");

            migrationBuilder.DropForeignKey(
                name: "FK_FrozenBalanceChanges_Users_UserId",
                table: "FrozenBalanceChanges");

            migrationBuilder.DropIndex(
                name: "IX_FrozenBalanceChanges_UserId_FreezeDate",
                table: "FrozenBalanceChanges");

            migrationBuilder.DropIndex(
                name: "IX_BalanceChanges_UserId_Date",
                table: "BalanceChanges");

            migrationBuilder.CreateTable(
                name: "PublicDisputes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    TransactionId = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    RequisiteId = table.Column<int>(type: "int", nullable: true),
                    DeviceId = table.Column<int>(type: "int", nullable: true),
                    DealAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    FilesJson = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TimerEndUtc = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    PausedRemainingSeconds = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PublicDisputes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PublicDisputes_Devices_DeviceId",
                        column: x => x.DeviceId,
                        principalTable: "Devices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PublicDisputes_OwnerRequisites_RequisiteId",
                        column: x => x.RequisiteId,
                        principalTable: "OwnerRequisites",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_FrozenBalanceChanges_UserId",
                table: "FrozenBalanceChanges",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_BalanceChanges_UserId",
                table: "BalanceChanges",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PublicDisputes_DeviceId",
                table: "PublicDisputes",
                column: "DeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_PublicDisputes_RequisiteId",
                table: "PublicDisputes",
                column: "RequisiteId");

            migrationBuilder.AddForeignKey(
                name: "FK_BalanceChanges_Users_UserId",
                table: "BalanceChanges",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_FrozenBalanceChanges_Users_UserId",
                table: "FrozenBalanceChanges",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BalanceChanges_Users_UserId",
                table: "BalanceChanges");

            migrationBuilder.DropForeignKey(
                name: "FK_FrozenBalanceChanges_Users_UserId",
                table: "FrozenBalanceChanges");

            migrationBuilder.DropTable(
                name: "PublicDisputes");

            migrationBuilder.DropIndex(
                name: "IX_FrozenBalanceChanges_UserId",
                table: "FrozenBalanceChanges");

            migrationBuilder.DropIndex(
                name: "IX_BalanceChanges_UserId",
                table: "BalanceChanges");

            migrationBuilder.CreateIndex(
                name: "IX_FrozenBalanceChanges_UserId_FreezeDate",
                table: "FrozenBalanceChanges",
                columns: new[] { "UserId", "FreezeDate" });

            migrationBuilder.CreateIndex(
                name: "IX_BalanceChanges_UserId_Date",
                table: "BalanceChanges",
                columns: new[] { "UserId", "Date" });

            migrationBuilder.AddForeignKey(
                name: "FK_BalanceChanges_Users_UserId",
                table: "BalanceChanges",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_FrozenBalanceChanges_Users_UserId",
                table: "FrozenBalanceChanges",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
