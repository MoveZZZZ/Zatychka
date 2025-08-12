using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Zatychka.Server.Migrations
{
    /// <inheritdoc />
    public partial class IntakeDateConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PublicDisputes_Devices_DeviceId",
                table: "PublicDisputes");

            migrationBuilder.DropForeignKey(
                name: "FK_PublicDisputes_OwnerRequisites_RequisiteId",
                table: "PublicDisputes");

            migrationBuilder.CreateTable(
                name: "IntakeDateConfigs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Mode = table.Column<int>(type: "int", nullable: false),
                    CustomDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IntakeDateConfigs", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.InsertData(
                table: "IntakeDateConfigs",
                columns: new[] { "Id", "CustomDate", "Mode", "UpdatedAt" },
                values: new object[] { 1, null, 0, new DateTime(2025, 8, 12, 0, 40, 13, 10, DateTimeKind.Utc).AddTicks(2887) });

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
                name: "FK_PublicDisputes_Devices_DeviceId",
                table: "PublicDisputes");

            migrationBuilder.DropForeignKey(
                name: "FK_PublicDisputes_OwnerRequisites_RequisiteId",
                table: "PublicDisputes");

            migrationBuilder.DropTable(
                name: "IntakeDateConfigs");

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
