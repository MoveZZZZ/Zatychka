using Microsoft.EntityFrameworkCore;
using Zatychka.Server.Data;
using Zatychka.Server.Models;

namespace Zatychka.Server.Repositories
{
    public class RequisiteRepository : IRequisiteRepository
    {
        private readonly AppDbContext _db;
        public RequisiteRepository(AppDbContext db) { _db = db; }

        public async Task<OwnerRequisite> AddAsync(OwnerRequisite req)
        {
            _db.OwnerRequisites.Add(req);
            await _db.SaveChangesAsync();
            return req;
        }

        public async Task<OwnerRequisite?> GetByIdAsync(int id)
        {
            return await _db.OwnerRequisites
                .Include(r => r.Owner)
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task UpdateAsync(OwnerRequisite req)
        {
            req.UpdatedAt = DateTime.UtcNow;
            _db.OwnerRequisites.Update(req);
            await _db.SaveChangesAsync();
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var entity = await _db.OwnerRequisites.FirstOrDefaultAsync(r => r.Id == id);
            if (entity == null) return false;
            _db.OwnerRequisites.Remove(entity);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<List<OwnerRequisite>> GetForOwnerAsync(int ownerId)
        {
            return await _db.OwnerRequisites
                .Where(r => r.OwnerId == ownerId)
                .OrderByDescending(r => r.Id)
                .ToListAsync();
        }
    }
}
