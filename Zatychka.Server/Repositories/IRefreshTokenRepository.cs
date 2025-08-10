using Zatychka.Server.Models;

namespace Zatychka.Server.Repositories
{
    public interface IRefreshTokenRepository
    {
        Task AddAsync(RefreshToken token);
        Task<RefreshToken?> GetByTokenAsync(string token);
        Task InvalidateAsync(string token);
        Task InvalidateAllForUserAsync(int userId);
    }
}
