using Zatychka.Server.Data;
using Zatychka.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Zatychka.Server.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _context;

        public UserRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<User> GetByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task AddUserAsync(User user)
        {
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
        }
        public async Task<User?> GetByLoginAsync(string login)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Login == login);
        }
        public Task<User?> GetByIdAsync(int id) =>
           _context.Users.FirstOrDefaultAsync(u => u.Id == id)!;
        public Task<User?> GetByPhoneAsync(string phone) =>
           _context.Users.FirstOrDefaultAsync(u => u.Phone == phone)!;
        public Task<bool> ExistsLoginAsync(string login, int excludeUserId) =>
            _context.Users.AnyAsync(u => u.Login == login && u.Id != excludeUserId);
        public Task<bool> ExistsEmailAsync(string email, int excludeUserId) =>
          _context.Users.AnyAsync(u => u.Email == email && u.Id != excludeUserId);
        public Task<bool> ExistsPhoneAsync(string phone, int excludeUserId) =>
            _context.Users.AnyAsync(u => u.Phone == phone && u.Id != excludeUserId);
        public Task UpdateAsync(User user)
        {
            _context.Users.Update(user);
            return Task.CompletedTask;
        }

        public Task SaveChangesAsync() => _context.SaveChangesAsync();
    }
}
