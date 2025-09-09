using Zatychka.Server.DTO;
using Zatychka.Server.Models;

namespace Zatychka.Server.Repositories
{
    public interface IDeviceRepository
    {
        Task AddDeviceAsync(Device device);
        Task<List<Device>> GetDevicesByUserIdAsync(int userId);
        Task<Device?> GetByIdAsync(int id);
        Task UpdateAsync(Device device);
        Task DeleteAsync(Device device);
        Task<IEnumerable<DeviceWithStatusDto>> GetDevicesWithStatusByUserIdAsync(int userId);
    }
}
