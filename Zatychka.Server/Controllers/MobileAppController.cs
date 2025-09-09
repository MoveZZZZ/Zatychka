// Controllers/MobileAppController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Zatychka.Server.Data;
using Zatychka.Server.Models;

namespace Zatychka.Server.Controllers
{
    [ApiController]
    [Route("api/mobileapp")]
    public class MobileAppController : ControllerBase
    {
        private readonly AppDbContext _db;
        public MobileAppController(AppDbContext db) => _db = db;

        public class DeviceStatusCreateDto
        {
            public int DeviceId { get; set; }
            public string? Name { get; set; }          // не обязателен
            public string Model { get; set; } = "";    // обязательный (из телефона)
            public string? Status { get; set; }        // по умолчанию Online
        }

        /// <summary>
        /// Мобильное приложение пишет факт подключения/логина.
        /// </summary>
        [HttpPost("status")]
        public async Task<IActionResult> PostStatus([FromBody] DeviceStatusCreateDto dto)
        {
            if (dto.DeviceId <= 0) return BadRequest("DeviceId required");
            if (string.IsNullOrWhiteSpace(dto.Model)) return BadRequest("Model required");

            var entity = new DeviceStatus
            {
                DeviceId = dto.DeviceId,
                Name = dto.Name ?? string.Empty,
                Model = dto.Model,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Online" : dto.Status!,
                ActivationDate = DateTime.UtcNow
            };

            _db.DevicesStatus.Add(entity);
            await _db.SaveChangesAsync();

            return Ok(new { ok = true, id = entity.Id });
        }
    }
}
