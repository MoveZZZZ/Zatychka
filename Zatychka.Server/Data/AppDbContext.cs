using System.Collections.Generic;
using Zatychka.Server.Models;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;

namespace Zatychka.Server.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Device> Devices { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<Owner> Owners => Set<Owner>();
        public DbSet<OwnerRequisite> OwnerRequisites => Set<OwnerRequisite>();
        public DbSet<Link> Links { get; set; } = null!;
        public DbSet<AppSetting> AppSettings { get; set; } = null!;
        public DbSet<UserWallet> UserWallets => Set<UserWallet>();
        public DbSet<PublicWallet> PublicWallets { get; set; }

        public DbSet<PublicWalletUser> PublicWalletUser { get; set; }
        public DbSet<PrivateWalletUser> PrivateWalletUser { get; set; }
        public DbSet<PrivateStatisticsUser> PrivateStatisticsUsers { get; set; } = null!;

        public DbSet<PayinTransactionPublic> PayinTransactionsPublic => Set<PayinTransactionPublic>();
        public DbSet<PayinTransactionPrivate> PayinTransactionsPrivate => Set<PayinTransactionPrivate>();

        public DbSet<BalanceChange> BalanceChanges => Set<BalanceChange>();
        public DbSet<FrozenBalanceChange> FrozenBalanceChanges => Set<FrozenBalanceChange>();
        public DbSet<PublicDispute> PublicDisputes { get; set; } = null!;
        public DbSet<Zatychka.Server.Models.IntakeDateConfig> IntakeDateConfigs { get; set; }
        public DbSet<PrivateDispute> PrivateDisputes { get; set; } = null!;
        public DbSet<UserTelegramLink> TelegramLinks { get; set; } = null!;
        public DbSet<DepositCursor> DepositCursors { get; set; } = default!;
        protected override void OnModelCreating(ModelBuilder b)
        {
            b.Entity<UserTelegramLink>(e =>
            {
                e.ToTable("UserTelegramLinks");
                e.HasIndex(x => x.UserId).IsUnique();
                e.HasIndex(x => x.Username).IsUnique();
                e.Property(x => x.Username).HasColumnType("varchar(64)");
                e.Property(x => x.Source).HasColumnType("varchar(128)");
            });
        }
    }
}
