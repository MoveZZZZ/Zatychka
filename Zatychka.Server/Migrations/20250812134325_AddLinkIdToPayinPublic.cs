using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Zatychka.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddLinkIdToPayinPublic : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LinkId",
                table: "PayinTransactionsPublic",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PayinTransactionsPublic_LinkId",
                table: "PayinTransactionsPublic",
                column: "LinkId");

            migrationBuilder.AddForeignKey(
                name: "FK_PayinTransactionsPublic_Links_LinkId",
                table: "PayinTransactionsPublic",
                column: "LinkId",
                principalTable: "Links",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PayinTransactionsPublic_Links_LinkId",
                table: "PayinTransactionsPublic");

            migrationBuilder.DropIndex(
                name: "IX_PayinTransactionsPublic_LinkId",
                table: "PayinTransactionsPublic");

            migrationBuilder.DropColumn(
                name: "LinkId",
                table: "PayinTransactionsPublic");
        }
    }
}
