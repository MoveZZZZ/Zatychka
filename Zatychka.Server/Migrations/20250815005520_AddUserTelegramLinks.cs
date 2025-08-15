using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Zatychka.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddUserTelegramLinks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PayinTransactionsPublic_Devices_DeviceId",
                table: "PayinTransactionsPublic");

            migrationBuilder.DropForeignKey(
                name: "FK_PayinTransactionsPublic_OwnerRequisites_RequisiteId",
                table: "PayinTransactionsPublic");

            migrationBuilder.DropForeignKey(
                name: "FK_PublicDisputes_Devices_DeviceId",
                table: "PublicDisputes");

            migrationBuilder.DropForeignKey(
                name: "FK_PublicDisputes_OwnerRequisites_RequisiteId",
                table: "PublicDisputes");

            migrationBuilder.CreateTable(
                name: "UserTelegramLinks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Username = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TelegramUserId = table.Column<long>(type: "bigint", nullable: true),
                    Source = table.Column<string>(type: "varchar(128)", maxLength: 128, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserTelegramLinks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserTelegramLinks_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

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
                name: "FK_PayinTransactionsPublic_Devices_DeviceId",
                table: "PayinTransactionsPublic",
                column: "DeviceId",
                principalTable: "Devices",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PayinTransactionsPublic_OwnerRequisites_RequisiteId",
                table: "PayinTransactionsPublic",
                column: "RequisiteId",
                principalTable: "OwnerRequisites",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PublicDisputes_Devices_DeviceId",
                table: "PublicDisputes",
                column: "DeviceId",
                principalTable: "Devices",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PublicDisputes_OwnerRequisites_RequisiteId",
                table: "PublicDisputes",
                column: "RequisiteId",
                principalTable: "OwnerRequisites",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PayinTransactionsPublic_Devices_DeviceId",
                table: "PayinTransactionsPublic");

            migrationBuilder.DropForeignKey(
                name: "FK_PayinTransactionsPublic_OwnerRequisites_RequisiteId",
                table: "PayinTransactionsPublic");

            migrationBuilder.DropForeignKey(
                name: "FK_PublicDisputes_Devices_DeviceId",
                table: "PublicDisputes");

            migrationBuilder.DropForeignKey(
                name: "FK_PublicDisputes_OwnerRequisites_RequisiteId",
                table: "PublicDisputes");

            migrationBuilder.DropTable(
                name: "UserTelegramLinks");

            migrationBuilder.AddForeignKey(
                name: "FK_PayinTransactionsPublic_Devices_DeviceId",
                table: "PayinTransactionsPublic",
                column: "DeviceId",
                principalTable: "Devices",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_PayinTransactionsPublic_OwnerRequisites_RequisiteId",
                table: "PayinTransactionsPublic",
                column: "RequisiteId",
                principalTable: "OwnerRequisites",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_PublicDisputes_Devices_DeviceId",
                table: "PublicDisputes",
                column: "DeviceId",
                principalTable: "Devices",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_PublicDisputes_OwnerRequisites_RequisiteId",
                table: "PublicDisputes",
                column: "RequisiteId",
                principalTable: "OwnerRequisites",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
