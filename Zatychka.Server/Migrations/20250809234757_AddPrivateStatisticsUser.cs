using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Metadata;

#nullable disable

namespace Zatychka.Server.Migrations
{
    public partial class AddPrivateStatisticsUser : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PrivateStatisticsUsers",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    UserId = table.Column<int>(nullable: false),

                    TotalTxCount = table.Column<int>(nullable: false),
                    TotalTxAmountUSDT = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ActiveTxCount = table.Column<int>(nullable: false),
                    ActiveTxAmountUSDT = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SuccessRateValue = table.Column<int>(nullable: false),
                    SuccessRateSuffix = table.Column<string>(maxLength: 8, nullable: true),
                    ProfitUSDT = table.Column<decimal>(type: "decimal(18,2)", nullable: false),

                    DisputesTotalCount = table.Column<int>(nullable: false),
                    DisputesActiveCount = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PrivateStatisticsUsers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PrivateStatisticsUsers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PrivateStatisticsUsers_UserId",
                table: "PrivateStatisticsUsers",
                column: "UserId",
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PrivateStatisticsUsers");
        }
    }
}
