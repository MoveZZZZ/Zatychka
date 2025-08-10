using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Zatychka.Server.DTOs;
using Zatychka.Server.Models;
using Zatychka.Server.Repositories;

namespace Zatychka.Server.Controllers
{
    [Route("api/devices")]
    [ApiController]
    public class DeviceController : ControllerBase
    {
        private readonly IDeviceRepository _deviceRepository;

        public DeviceController(IDeviceRepository deviceRepository)
        {
            _deviceRepository = deviceRepository;
        }

        [Authorize]
        [HttpPost("add")]
        public async Task<IActionResult> AddDevice([FromBody] AddDeviceRequest request)
        {
            if (request == null) return BadRequest(new { message = "Нет данных" });

            // нормализация пробелов
            var raw = request.Name ?? "";
            var name = System.Text.RegularExpressions.Regex.Replace(raw.Trim(), @"\s+", " ");

            if (string.IsNullOrWhiteSpace(name))
                return BadRequest(new { message = "Название обязательно" });
            if (name.Length > 64)
                return BadRequest(new { message = "Название слишком длинное" });

            var userIdClaim = User.FindFirst("userID")?.Value;
            if (userIdClaim == null) return Unauthorized();

            var device = new Device
            {
                Name = name,
                UserId = int.Parse(userIdClaim)
            };

            await _deviceRepository.AddDeviceAsync(device);
            // вернём созданный девайс, чтобы фронт мог сразу обновить список
            return Ok(new { id = device.Id, name = device.Name, userId = device.UserId });
        }

        [Authorize]
        [HttpGet("list")]
        public async Task<IActionResult> List()
        {
            var userIdClaim = User.FindFirst("userID")?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

            var userId = int.Parse(userIdClaim);
            var devices = await _deviceRepository.GetDevicesByUserIdAsync(userId);

            // Вернём ровно то, что нужно на фронт
            var dto = devices.Select(d => new {
                id = d.Id,
                name = d.Name,
            });

            return Ok(dto);
        }
        private int? GetUserId() =>
            int.TryParse(User.FindFirst("userID")?.Value, out var id) ? id : (int?)null;

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateDeviceRequest req)
        {
            var userId = GetUserId();
            if (userId is null) return Unauthorized();

            var device = await _deviceRepository.GetByIdAsync(id);
            if (device is null || device.UserId != userId) return NotFound();

            device.Name = req.Name?.Trim() ?? device.Name;
            await _deviceRepository.UpdateAsync(device);

            return Ok(new { device.Id, device.Name, device.UserId });
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetUserId();
            if (userId is null) return Unauthorized();

            var device = await _deviceRepository.GetByIdAsync(id);
            if (device is null || device.UserId != userId) return NotFound();

            await _deviceRepository.DeleteAsync(device);
            return NoContent();
        }
    }

    public class UpdateDeviceRequest
    {
        public string Name { get; set; } = string.Empty;
    }
}

