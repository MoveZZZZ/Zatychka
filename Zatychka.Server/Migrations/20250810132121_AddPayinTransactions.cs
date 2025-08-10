using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Zatychka.Server.Migrations
{
    public partial class AddPayinTransactions : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PayinTransactionsPublic",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        // для Pomelo MySQL EF тут обычно будет .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn)
                        ,
                    Date = table.Column<DateTime>(nullable: false),
                    Status = table.Column<int>(nullable: false),
                    RequisiteId = table.Column<int>(nullable: true),
                    DeviceId = table.Column<int>(nullable: true),
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
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PayinTransactionsPublic_Devices_DeviceId",
                        column: x => x.DeviceId,
                        principalTable: "Devices",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "PayinTransactionsPrivate",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false),
                    UserId = table.Column<int>(nullable: false),
                    Date = table.Column<DateTime>(nullable: false),
                    Status = table.Column<int>(nullable: false),
                    RequisiteId = table.Column<int>(nullable: true),
                    DeviceId = table.Column<int>(nullable: true),
                    DealAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    IncomeAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PayinTransactionsPrivate", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PayinTransactionsPrivate_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PayinTransactionsPrivate_OwnerRequisites_RequisiteId",
                        column: x => x.RequisiteId,
                        principalTable: "OwnerRequisites",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PayinTransactionsPrivate_Devices_DeviceId",
                        column: x => x.DeviceId,
                        principalTable: "Devices",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_PayinTransactionsPublic_RequisiteId",
                table: "PayinTransactionsPublic",
                column: "RequisiteId");

            migrationBuilder.CreateIndex(
                name: "IX_PayinTransactionsPublic_DeviceId",
                table: "PayinTransactionsPublic",
                column: "DeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_PayinTransactionsPrivate_UserId",
                table: "PayinTransactionsPrivate",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PayinTransactionsPrivate_RequisiteId",
                table: "PayinTransactionsPrivate",
                column: "RequisiteId");

            migrationBuilder.CreateIndex(
                name: "IX_PayinTransactionsPrivate_DeviceId",
                table: "PayinTransactionsPrivate",
                column: "DeviceId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "PayinTransactionsPrivate");
            migrationBuilder.DropTable(name: "PayinTransactionsPublic");
        }
    }
}
