using Zatychka.Server.Models;

namespace Zatychka.Server.Repositories
{
    public interface IRequisiteRepository
    {
        Task<OwnerRequisite> AddAsync(OwnerRequisite req);
        Task<OwnerRequisite?> GetByIdAsync(int id);
        Task UpdateAsync(OwnerRequisite req);
        Task<bool> DeleteAsync(int id);
        Task<List<OwnerRequisite>> GetForOwnerAsync(int ownerId);
    }
}
