using Zatychka.Server.Models;

namespace Zatychka.Server.Repositories
{
    public interface IUserRepository
    {
        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByLoginAsync(string login);
        Task AddUserAsync(User user);
        Task<User?> GetByIdAsync(int id);
        Task<User?> GetByPhoneAsync(string phone);

        Task<bool> ExistsLoginAsync(string login, int excludeUserId);
        Task<bool> ExistsEmailAsync(string email, int excludeUserId);
        Task<bool> ExistsPhoneAsync(string phone, int excludeUserId);

        Task UpdateAsync(User user);
        Task SaveChangesAsync();
    }
}
