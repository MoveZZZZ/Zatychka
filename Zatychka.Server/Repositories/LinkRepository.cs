using Zatychka.Server.Data;
using Zatychka.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Zatychka.Server.Repositories
{
    public class LinkRepository : ILinkRepository
    {
        private readonly AppDbContext _db;
        public LinkRepository(AppDbContext db) => _db = db;

        public Task<List<Link>> ListByUserAsync(int userId) =>
            _db.Links
               .AsNoTracking()
               .Include(l => l.Device)
               .Include(l => l.Requisite).ThenInclude(r => r.Owner)
               .Where(l => l.UserId == userId)
               .OrderByDescending(l => l.Id)
               .ToListAsync();

        public Task<Link?> GetByIdAsync(int id, int userId) =>
            _db.Links
               .Include(l => l.Device)
               .Include(l => l.Requisite).ThenInclude(r => r.Owner)
               .FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId);

        public async Task<Link> AddAsync(Link link)
        {
            _db.Links.Add(link);
            await _db.SaveChangesAsync();
            return link;
        }

        public async Task UpdateAsync(Link link)
        {
            link.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        public async Task DeleteAsync(Link link)
        {
            _db.Links.Remove(link);
            await _db.SaveChangesAsync();
        }
    }
}
