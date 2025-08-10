using Microsoft.EntityFrameworkCore;
using Zatychka.Server.Data;
using Zatychka.Server.Models;

namespace Zatychka.Server.Repositories
{
    public class OwnerRepository : IOwnerRepository
    {
        private readonly AppDbContext _db;
        public OwnerRepository(AppDbContext db) { _db = db; }

        public async Task<Owner> AddAsync(Owner owner)
        {
            _db.Owners.Add(owner);
            await _db.SaveChangesAsync();
            return owner;
        }

        public async Task<List<Owner>> GetForUserAsync(int userId)
        {
            return await _db.Owners
                .Where(o => o.UserId == userId)
                .Include(o => o.Requisites)
                .OrderByDescending(o => o.Id)
                .ToListAsync();
        }

        public async Task<Owner?> GetByIdAsync(int id, int userId, bool includeRequisites = false)
        {
            var q = _db.Owners.AsQueryable();
            if (includeRequisites) q = q.Include(o => o.Requisites);
            return await q.FirstOrDefaultAsync(o => o.Id == id && o.UserId == userId);
        }

        public async Task UpdateAsync(Owner owner)
        {
            owner.UpdatedAt = DateTime.UtcNow;
            _db.Owners.Update(owner);
            await _db.SaveChangesAsync();
        }

        public async Task<bool> DeleteAsync(int id, int userId)
        {
            var entity = await _db.Owners.FirstOrDefaultAsync(o => o.Id == id && o.UserId == userId);
            if (entity == null) return false;
            _db.Owners.Remove(entity);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
