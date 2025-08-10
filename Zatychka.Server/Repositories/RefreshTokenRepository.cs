using Microsoft.EntityFrameworkCore;
using Zatychka.Server.Data;
using Zatychka.Server.Models;

namespace Zatychka.Server.Repositories
{
    public class RefreshTokenRepository : IRefreshTokenRepository
    {
        private readonly AppDbContext _db;

        public RefreshTokenRepository(AppDbContext db)
        {
            _db = db;
        }

        public async Task AddAsync(RefreshToken token)
        {
            _db.RefreshTokens.Add(token);
            await _db.SaveChangesAsync();
        }

        public async Task<RefreshToken?> GetByTokenAsync(string token)
        {
            return await _db.RefreshTokens.FirstOrDefaultAsync(t => t.Token == token);
        }

        public async Task InvalidateAsync(string token)
        {
            var rt = await GetByTokenAsync(token);
            if (rt != null)
            {
                rt.RevokedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
        }

        public async Task InvalidateAllForUserAsync(int userId)
        {
            var tokens = await _db.RefreshTokens
                .Where(t => t.UserId == userId && t.RevokedAt == null)
                .ToListAsync();

            foreach (var t in tokens)
                t.RevokedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
        }
    }
}
