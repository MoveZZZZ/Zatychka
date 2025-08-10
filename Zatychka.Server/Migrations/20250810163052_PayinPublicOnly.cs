using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Zatychka.Server.Migrations
{
    public partial class PayinPublicOnly : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // На MySQL так безопаснее: если таблица уже есть с «кривыми» FKs — снесём её целиком.
            migrationBuilder.Sql("DROP TABLE IF EXISTS `PayinTransactionsPublic`;");

            migrationBuilder.CreateTable(
                name: "PayinTransactionsPublic",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Date = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Status = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RequisiteId = table.Column<int>(type: "int", nullable: true),
                    DeviceId = table.Column<int>(type: "int", nullable: true),
                    DealAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    IncomeAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PayinTransactionsPublic", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PayinTransactionsPublic_OwnerRequisites_RequisiteId",
                        column: x => x.RequisiteId,
                        principalTable: "OwnerRequisites",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PayinTransactionsPublic_Devices_DeviceId",
                        column: x => x.DeviceId,
                        principalTable: "Devices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_PayinTransactionsPublic_RequisiteId",
                table: "PayinTransactionsPublic",
                column: "RequisiteId");

            migrationBuilder.CreateIndex(
                name: "IX_PayinTransactionsPublic_DeviceId",
                table: "PayinTransactionsPublic",
                column: "DeviceId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PayinTransactionsPublic");
        }
    }
}
