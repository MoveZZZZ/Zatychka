using Microsoft.AspNetCore.Mvc;
using Zatychka.Server.DTOs;

namespace Zatychka.Server.Services
{
    public interface IDeviceService
    {
        Task<IActionResult> AddDevice([FromBody] AddDeviceRequest request);
        Task<IActionResult> GetDevices();
        Task<IActionResult> ChangeDeviceName([FromBody] AddDeviceRequest request);
        Task<IActionResult> DeleteDeviceByID([FromBody] AddDeviceRequest request);
    }
}
