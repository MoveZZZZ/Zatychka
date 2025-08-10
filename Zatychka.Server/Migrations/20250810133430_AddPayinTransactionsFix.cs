using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Zatychka.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddPayinTransactionsFix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"ALTER TABLE `PayinTransactionsPrivate`
                           MODIFY `Id` int NOT NULL AUTO_INCREMENT;");
            migrationBuilder.Sql(@"ALTER TABLE `PayinTransactionsPublic`
                           MODIFY `Id` int NOT NULL AUTO_INCREMENT;");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"ALTER TABLE `PayinTransactionsPrivate`
                           MODIFY `Id` int NOT NULL;");
            migrationBuilder.Sql(@"ALTER TABLE `PayinTransactionsPublic`
                           MODIFY `Id` int NOT NULL;");
        }
    }
}
