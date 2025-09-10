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

        public class LoginDto
        {
            public int DeviceId { get; set; }
            public string? Name { get; set; }           // опционально
            public string Model { get; set; } = "";     // модель телефона (обязательно)
            public int? UserId { get; set; }            // можно прислать (для доп. логики)
            public string? Email { get; set; }          // можно прислать (для логирования)
        }
        public class LogoutDto
        {
            public int DeviceId { get; set; }
        }

        /// <summary>
        /// Логин устройства. Если для этого DeviceId уже есть Online-запись с другой моделью — 409 + отдадим модель.
        /// Если уже Online с той же моделью — считаем идемпотентным и просто возвращаем OK.
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (dto.DeviceId <= 0) return BadRequest("DeviceId required");
            if (string.IsNullOrWhiteSpace(dto.Model)) return BadRequest("Model required");

            var existing = await _db.DevicesStatus
                .Where(x => x.DeviceId == dto.DeviceId && x.Status == "Online")
                .OrderByDescending(x => x.ActivationDate)
                .FirstOrDefaultAsync();

            if (existing != null)
            {
                // тот же телефон (по модели) — ок, делаем идемпотентно
                if (string.Equals(existing.Model, dto.Model, StringComparison.OrdinalIgnoreCase))
                {
                    return Ok(new { ok = true, id = existing.Id, already = true });
                }

                // другой телефон — конфликт + подсветим модель, кто "держит" устройство
                return Conflict(new
                {
                    ok = false,
                    reason = "already_logged_other_device",
                    model = existing.Model
                });
            }

            var row = new DeviceStatus
            {
                DeviceId = dto.DeviceId,
                Name = dto.Name ?? string.Empty,
                Model = dto.Model,
                Status = "Online",
                ActivationDate = DateTime.UtcNow
            };
            _db.DevicesStatus.Add(row);
            await _db.SaveChangesAsync();

            return Ok(new { ok = true, id = row.Id });
        }

        /// <summary>
        /// Логаут: удаляем все Online по DeviceId (идемпотентно).
        /// </summary>
        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] LogoutDto dto)
        {
            if (dto.DeviceId <= 0) return BadRequest("DeviceId required");

            var rows = await _db.DevicesStatus
                .Where(x => x.DeviceId == dto.DeviceId && x.Status == "Online")
                .ToListAsync();

            if (rows.Count > 0)
            {
                _db.DevicesStatus.RemoveRange(rows);
                await _db.SaveChangesAsync();
            }

            return Ok(new { ok = true, removed = rows.Count });
        }

        /// <summary>
        /// 10 последних PayinTransactionPrivate. Можно фильтровать по userId (?userId=...).
        /// </summary>
        [HttpGet("payins/latest")]
        public async Task<IActionResult> LatestPayins([FromQuery] int? userId = null)
        {
            var q = _db.Set<PayinTransactionPrivate>().AsQueryable();
            if (userId is > 0) q = q.Where(p => p.UserId == userId);

            var items = await q
                .OrderByDescending(p => p.Date)
                .ThenByDescending(p => p.Id)
                .Take(10)
                .Select(p => new
                {
                    id = p.Id,
                    userId = p.UserId,
                    date = p.Date,
                    status = p.Status.ToString(),
                    dealAmount = p.DealAmount,
                    incomeAmount = p.IncomeAmount,
                    deviceId = p.DeviceId
                })
                .ToListAsync();

            return Ok(items);
        }
    }
}
