using Zatychka.Server.Models;

namespace Zatychka.Server.Repositories
{
    public interface IUserWalletRepository
    {
        Task<UserWallet> GetOrCreateAsync(int userId);
        Task<UserWallet> UpdateAsync(int userId, decimal? mainUsdt, decimal? frozenUsdt);
    }
}