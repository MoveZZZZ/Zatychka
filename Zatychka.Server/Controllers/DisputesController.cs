using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;
using Zatychka.Server.Data;
using Zatychka.Server.Models;

namespace Zatychka.Server.Controllers
{
    [Route("api/disputes")]
    [ApiController]
    public class DisputesController : ControllerBase
    {
        private readonly AppDbContext _db;
        public DisputesController(AppDbContext db) => _db = db;

        private static string FormatRequisite(OwnerRequisite r)
        {
            if (r == null) return null!;
            var val = r.Value ?? string.Empty;
            switch (r.Type)
            {
                case RequisiteType.Card:
                    var digits = new string(val.Where(char.IsDigit).ToArray());
                    var last4 = digits.Length >= 4 ? digits[^4..] : null;
                    return last4 != null ? $"Карта •••• {last4}" : "Карта";
                case RequisiteType.Phone:
                    return $"Телефон {val}";
                case RequisiteType.Email:
                    return $"Email {val}";
                default:
                    return val;
            }
        }

        // DTOs
        public class DisputeCreateDto
        {
            public int? TransactionId { get; set; }
            [JsonConverter(typeof(JsonStringEnumConverter))]
            public DisputeStatus Status { get; set; }

            public int? RequisiteId { get; set; }
            public int? DeviceId { get; set; }

            public decimal DealAmount { get; set; }

            // список строк (ссылки/имена); опционально
            public List<string>? Files { get; set; }

            // Таймер: часы/минуты/секунды, админ выставляет
            public int Hours { get; set; }
            public int Minutes { get; set; }
            public int Seconds { get; set; }
        }

        public class DisputeListItemDto
        {
            public int Id { get; set; }
            public int? TransactionId { get; set; }
            public string Status { get; set; } = null!;
            public string? RequisiteDisplay { get; set; }
            public string? DeviceName { get; set; }
            public decimal DealAmount { get; set; }
            public List<string>? Files { get; set; }
            public int RemainingSeconds { get; set; } // для таймера
        }

        // ленивое завершение просроченных
        private async Task<int> CloseExpiredAsync(List<PublicDispute> entities)
        {
            var now = DateTime.UtcNow;
            var changed = 0;
            foreach (var d in entities)
            {
                if (d.Status == DisputeStatus.InProgress && d.TimerEndUtc.HasValue && d.TimerEndUtc.Value <= now)
                {
                    d.Status = DisputeStatus.Completed;
                    d.TimerEndUtc = null;
                    d.PausedRemainingSeconds = 0;
                    d.UpdatedAt = now;
                    changed++;
                }
            }
            if (changed > 0)
                await _db.SaveChangesAsync();
            return changed;
        }

        [HttpGet("public")]
        [Authorize] // видят все авторизованные
        public async Task<IActionResult> ListPublic([FromQuery(Name = "statuses")] List<DisputeStatus>? statuses = null,
                                                    [FromQuery] int? transactionId = null)
        {
            var q = _db.PublicDisputes
                .Include(x => x.Requisite).ThenInclude(r => r.Owner).ThenInclude(o => o.User)
                .Include(x => x.Device).ThenInclude(d => d.User)
                .AsQueryable();

            if (statuses is { Count: > 0 })
                q = q.Where(x => statuses.Contains(x.Status));
            if (transactionId.HasValue)
                q = q.Where(x => x.TransactionId == transactionId.Value);

            var list = await q.OrderByDescending(x => x.CreatedAt).ToListAsync();

            // лениво завершаем просроченные
            await CloseExpiredAsync(list);

            var now = DateTime.UtcNow;

            var result = list.Select(x =>
            {
                int remaining = 0;
                if (x.Status == DisputeStatus.InProgress && x.TimerEndUtc.HasValue)
                {
                    remaining = (int)Math.Max(0, Math.Ceiling((x.TimerEndUtc.Value - now).TotalSeconds));
                }
                else if (x.Status == DisputeStatus.Frozen && x.PausedRemainingSeconds.HasValue)
                {
                    remaining = Math.Max(0, x.PausedRemainingSeconds.Value);
                }

                List<string>? files = null;
                if (!string.IsNullOrWhiteSpace(x.FilesJson))
                {
                    try { files = JsonSerializer.Deserialize<List<string>>(x.FilesJson); }
                    catch { files = null; }
                }

                return new DisputeListItemDto
                {
                    Id = x.Id,
                    TransactionId = x.TransactionId,
                    Status = x.Status.ToString(),
                    RequisiteDisplay = x.Requisite != null ? FormatRequisite(x.Requisite) : null,
                    DeviceName = x.Device?.Name,
                    DealAmount = x.DealAmount,
                    Files = files,
                    RemainingSeconds = remaining
                };
            }).ToList();

            return Ok(result);
        }

        [HttpPost("public")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> CreatePublic([FromBody] DisputeCreateDto dto)
        {
            var totalSeconds = Math.Max(0, dto.Hours * 3600 + dto.Minutes * 60 + dto.Seconds);
            var now = DateTime.UtcNow;

            var entity = new PublicDispute
            {
                TransactionId = dto.TransactionId,
                Status = dto.Status,
                RequisiteId = dto.RequisiteId,
                DeviceId = dto.DeviceId,
                DealAmount = dto.DealAmount,
                FilesJson = dto.Files != null ? JsonSerializer.Serialize(dto.Files) : null,
                TimerEndUtc = dto.Status == DisputeStatus.InProgress
                    ? now.AddSeconds(totalSeconds)
                    : null,
                PausedRemainingSeconds = dto.Status == DisputeStatus.Frozen
                    ? totalSeconds
                    : null,
                CreatedAt = now,
                UpdatedAt = now
            };

            _db.PublicDisputes.Add(entity);
            await _db.SaveChangesAsync();
            return Ok(new { id = entity.Id });
        }

        [HttpDelete("public/{id:int}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeletePublic(int id)
        {
            var e = await _db.PublicDisputes.FirstOrDefaultAsync(x => x.Id == id);
            if (e == null) return NotFound();
            _db.PublicDisputes.Remove(e);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
