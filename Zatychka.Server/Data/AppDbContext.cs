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

        public DbSet<BalanceChange> BalanceChanges => Set<BalanceChange>();
        public DbSet<FrozenBalanceChange> FrozenBalanceChanges => Set<FrozenBalanceChange>();
        public DbSet<PublicDispute> PublicDisputes { get; set; } = null!;
        public DbSet<Zatychka.Server.Models.IntakeDateConfig> IntakeDateConfigs { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

           
            modelBuilder.Entity<PublicDispute>()
                .HasOne(d => d.Requisite)
                .WithMany()
                .HasForeignKey(d => d.RequisiteId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<PublicDispute>()
                .HasOne(d => d.Device)
                .WithMany()
                .HasForeignKey(d => d.DeviceId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<PayinTransactionPublic>()
                .HasOne(t => t.Requisite)
                .WithMany()
                .HasForeignKey(t => t.RequisiteId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<PayinTransactionPublic>()
                .HasOne(t => t.Device)
                .WithMany()
                .HasForeignKey(t => t.DeviceId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
