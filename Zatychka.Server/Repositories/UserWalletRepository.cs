// Repositories/UserWalletRepository.cs
using Microsoft.EntityFrameworkCore;
using Zatychka.Server.Data;
using Zatychka.Server.Models;

namespace Zatychka.Server.Repositories
{
    public class UserWalletRepository : IUserWalletRepository
    {
        private readonly AppDbContext _db;
        public UserWalletRepository(AppDbContext db) => _db = db;

        public async Task<UserWallet> GetOrCreateAsync(int userId)
        {
            var w = await _db.UserWallets.FirstOrDefaultAsync(x => x.UserId == userId);
            if (w != null) return w;

            w = new UserWallet { UserId = userId, MainUsdt = 0m, FrozenUsdt = 0m };
            _db.UserWallets.Add(w);
            await _db.SaveChangesAsync();
            return w;
        }

        public async Task<UserWallet> UpdateAsync(int userId, decimal? mainUsdt, decimal? frozenUsdt)
        {
            var w = await GetOrCreateAsync(userId);
            if (mainUsdt.HasValue) w.MainUsdt = mainUsdt.Value;
            if (frozenUsdt.HasValue) w.FrozenUsdt = frozenUsdt.Value;
            w.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return w;
        }
    }
}
