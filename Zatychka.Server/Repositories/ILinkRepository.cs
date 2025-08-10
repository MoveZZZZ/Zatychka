using Zatychka.Server.Models;

namespace Zatychka.Server.Repositories
{
    public interface ILinkRepository
    {
        Task<List<Link>> ListByUserAsync(int userId);
        Task<Link?> GetByIdAsync(int id, int userId);
        Task<Link> AddAsync(Link link);
        Task UpdateAsync(Link link);
        Task DeleteAsync(Link link);
    }
}
