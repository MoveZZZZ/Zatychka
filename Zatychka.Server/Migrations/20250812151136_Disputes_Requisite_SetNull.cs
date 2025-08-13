using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Zatychka.Server.Migrations
{
    /// <inheritdoc />
    public partial class Disputes_Requisite_SetNull : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // --- Drop existing FKs on PayinTransactionsPublic (name-agnostic) ---
            migrationBuilder.Sql(@"
SET @fk := (
  SELECT CONSTRAINT_NAME
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'PayinTransactionsPublic'
    AND COLUMN_NAME = 'DeviceId'
    AND REFERENCED_TABLE_NAME = 'Devices'
  LIMIT 1
);
SET @sql := IF(@fk IS NOT NULL,
  CONCAT('ALTER TABLE `PayinTransactionsPublic` DROP FOREIGN KEY `', @fk, '`'),
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
");

            migrationBuilder.Sql(@"
SET @fk := (
  SELECT CONSTRAINT_NAME
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'PayinTransactionsPublic'
    AND COLUMN_NAME = 'RequisiteId'
    AND REFERENCED_TABLE_NAME = 'OwnerRequisites'
  LIMIT 1
);
SET @sql := IF(@fk IS NOT NULL,
  CONCAT('ALTER TABLE `PayinTransactionsPublic` DROP FOREIGN KEY `', @fk, '`'),
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
");

            migrationBuilder.Sql(@"
SET @fk := (
  SELECT CONSTRAINT_NAME
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'PayinTransactionsPublic'
    AND COLUMN_NAME = 'LinkId'
    AND REFERENCED_TABLE_NAME = 'Links'
  LIMIT 1
);
SET @sql := IF(@fk IS NOT NULL,
  CONCAT('ALTER TABLE `PayinTransactionsPublic` DROP FOREIGN KEY `', @fk, '`'),
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
");

            // --- Drop existing FKs on PublicDisputes (name-agnostic) ---
            migrationBuilder.Sql(@"
SET @fk := (
  SELECT CONSTRAINT_NAME
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'PublicDisputes'
    AND COLUMN_NAME = 'DeviceId'
    AND REFERENCED_TABLE_NAME = 'Devices'
  LIMIT 1
);
SET @sql := IF(@fk IS NOT NULL,
  CONCAT('ALTER TABLE `PublicDisputes` DROP FOREIGN KEY `', @fk, '`'),
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
");

            migrationBuilder.Sql(@"
SET @fk := (
  SELECT CONSTRAINT_NAME
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'PublicDisputes'
    AND COLUMN_NAME = 'RequisiteId'
    AND REFERENCED_TABLE_NAME = 'OwnerRequisites'
  LIMIT 1
);
SET @sql := IF(@fk IS NOT NULL,
  CONCAT('ALTER TABLE `PublicDisputes` DROP FOREIGN KEY `', @fk, '`'),
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
");

            // --- Drop legacy composite indexes if still exist ---
            migrationBuilder.Sql(@"
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'PayinTransactionsPublic'
    AND INDEX_NAME = 'IX_PayinTransactionsPublic_DeviceId_RequisiteId_Date'
);
SET @sql := IF(@exists > 0,
  'ALTER TABLE `PayinTransactionsPublic` DROP INDEX `IX_PayinTransactionsPublic_DeviceId_RequisiteId_Date`',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
");

            migrationBuilder.Sql(@"
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'PayinTransactionsPublic'
    AND INDEX_NAME = 'IX_PayinTransactionsPublic_LinkId_Date'
);
SET @sql := IF(@exists > 0,
  'ALTER TABLE `PayinTransactionsPublic` DROP INDEX `IX_PayinTransactionsPublic_LinkId_Date`',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
");

            // --- Ensure LinkId is nullable ---
            migrationBuilder.AlterColumn<int>(
                name: "LinkId",
                table: "PayinTransactionsPublic",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true
            );

            // --- Create simple indexes ONLY IF NOT EXISTS (avoid duplicate key name) ---
            migrationBuilder.Sql(@"
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'PayinTransactionsPublic'
    AND INDEX_NAME = 'IX_PayinTransactionsPublic_DeviceId'
);
SET @sql := IF(@exists = 0,
  'CREATE INDEX `IX_PayinTransactionsPublic_DeviceId` ON `PayinTransactionsPublic` (`DeviceId`)',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
");

            migrationBuilder.Sql(@"
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'PayinTransactionsPublic'
    AND INDEX_NAME = 'IX_PayinTransactionsPublic_LinkId'
);
SET @sql := IF(@exists = 0,
  'CREATE INDEX `IX_PayinTransactionsPublic_LinkId` ON `PayinTransactionsPublic` (`LinkId`)',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
");

            // --- Add FKs with ON DELETE SET NULL where required ---
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
                name: "FK_PayinTransactionsPublic_Links_LinkId",
                table: "PayinTransactionsPublic",
                column: "LinkId",
                principalTable: "Links",
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop new FKs
            migrationBuilder.DropForeignKey(
                name: "FK_PayinTransactionsPublic_Devices_DeviceId",
                table: "PayinTransactionsPublic");

            migrationBuilder.DropForeignKey(
                name: "FK_PayinTransactionsPublic_OwnerRequisites_RequisiteId",
                table: "PayinTransactionsPublic");

            migrationBuilder.DropForeignKey(
                name: "FK_PayinTransactionsPublic_Links_LinkId",
                table: "PayinTransactionsPublic");

            migrationBuilder.DropForeignKey(
                name: "FK_PublicDisputes_Devices_DeviceId",
                table: "PublicDisputes");

            migrationBuilder.DropForeignKey(
                name: "FK_PublicDisputes_OwnerRequisites_RequisiteId",
                table: "PublicDisputes");

            // Drop simple indexes (only if exist)
            migrationBuilder.Sql(@"
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'PayinTransactionsPublic'
    AND INDEX_NAME = 'IX_PayinTransactionsPublic_DeviceId'
);
SET @sql := IF(@exists > 0,
  'ALTER TABLE `PayinTransactionsPublic` DROP INDEX `IX_PayinTransactionsPublic_DeviceId`',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
");

            migrationBuilder.Sql(@"
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'PayinTransactionsPublic'
    AND INDEX_NAME = 'IX_PayinTransactionsPublic_LinkId'
);
SET @sql := IF(@exists > 0,
  'ALTER TABLE `PayinTransactionsPublic` DROP INDEX `IX_PayinTransactionsPublic_LinkId`',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
");

            // Restore old composite indexes
            migrationBuilder.CreateIndex(
                name: "IX_PayinTransactionsPublic_DeviceId_RequisiteId_Date",
                table: "PayinTransactionsPublic",
                columns: new[] { "DeviceId", "RequisiteId", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_PayinTransactionsPublic_LinkId_Date",
                table: "PayinTransactionsPublic",
                columns: new[] { "LinkId", "Date" });

            // Re-add former FKs without SetNull (historical defaults)
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
                name: "FK_PayinTransactionsPublic_Links_LinkId",
                table: "PayinTransactionsPublic",
                column: "LinkId",
                principalTable: "Links",
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
    }
}
