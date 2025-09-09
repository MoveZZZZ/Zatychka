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
        public DbSet<DeviceStatus> DevicesStatus => Set<DeviceStatus>();
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


        public DbSet<PublicReserve> PublicReserves => Set<PublicReserve>();
        public DbSet<PrivateReserve> PrivateReserves => Set<PrivateReserve>();
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<PublicReserve>(b =>
            {
                b.ToTable("PublicReserves");
                b.HasKey(x => x.Id);
                b.Property(x => x.Amount).HasPrecision(18, 2).IsRequired();
                b.Property(x => x.UpdatedAt).IsRequired();

                b.HasData(new PublicReserve { Id = 1, Amount = 0m, UpdatedAt = DateTimeOffset.UtcNow });
            });

            modelBuilder.Entity<PrivateReserve>(b =>
            {
                b.ToTable("PrivateReserves");
                b.HasKey(x => x.Id);
                b.Property(x => x.UserId).HasMaxLength(128).IsRequired();
                b.Property(x => x.Amount).HasPrecision(18, 2).IsRequired();
                b.Property(x => x.UpdatedAt).IsRequired();
                b.HasIndex(x => x.UserId).IsUnique();
            });
        }
    }
}
