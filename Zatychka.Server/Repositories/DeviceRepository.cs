using Zatychka.Server.Models;
using Microsoft.EntityFrameworkCore;
using Zatychka.Server.Data;

namespace Zatychka.Server.Repositories
{
    public class DeviceRepository:IDeviceRepository
    {
        private readonly AppDbContext _context;

        public DeviceRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddDeviceAsync(Device device)
        {
            _context.Devices.Add(device);
            await _context.SaveChangesAsync();
        }

        public async Task<List<Device>> GetDevicesByUserIdAsync(int userId)
        {
            return await _context.Devices
                .Where(d => d.UserId == userId)
                .ToListAsync();
        }
        public Task<Device?> GetByIdAsync(int id) =>
       _context.Devices.FirstOrDefaultAsync(d => d.Id == id);

        public async Task UpdateAsync(Device device)
        {
            _context.Devices.Update(device);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Device device)
        {
            _context.Devices.Remove(device);
            await _context.SaveChangesAsync();
        }
    }
}

