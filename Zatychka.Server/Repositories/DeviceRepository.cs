using Zatychka.Server.Models;
using Microsoft.EntityFrameworkCore;
using Zatychka.Server.Data;
using Zatychka.Server.DTO;

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
        public async Task<IEnumerable<DeviceWithStatusDto>> GetDevicesWithStatusByUserIdAsync(int userId)
        {
            var query = _context.Devices
                .AsNoTracking()
                .Where(d => d.UserId == userId)
                .Select(d => new
                {
                    d.Id,
                    d.Name,
                    Last = _context.DevicesStatus
                        .Where(s => s.DeviceId == d.Id)
                        .OrderByDescending(s => s.ActivationDate)
                        .ThenByDescending(s => s.Id)
                        .Select(s => new { s.Model, s.Status })
                        .FirstOrDefault()
                })
                .Select(x => new DeviceWithStatusDto
                {
                    Id = x.Id,
                    Name = x.Name,
                    Model = x.Last != null ? x.Last.Model : "",
                    Status = x.Last != null ? x.Last.Status : "Offline"
                });

            return await query.ToListAsync();
        }

    }
}

