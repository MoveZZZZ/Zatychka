using Zatychka.Server.Models;

namespace Zatychka.Server.Repositories
{
    public interface IOwnerRepository
    {
        Task<Owner> AddAsync(Owner owner);
        Task<List<Owner>> GetForUserAsync(int userId);
        Task<Owner?> GetByIdAsync(int id, int userId, bool includeRequisites = false);
        Task UpdateAsync(Owner owner);
        Task<bool> DeleteAsync(int id, int userId);
    }
}
