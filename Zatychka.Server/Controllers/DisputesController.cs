using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Security.Claims;
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

        /* ----------------------- helpers & DTO ----------------------- */

        private static string? FormatRequisite(OwnerRequisite? r)
        {
            if (r == null) return null;
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

        private int? GetCurrentUserId()
        {
            var id = User.FindFirst("userID")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(id, out var uid) ? uid : (int?)null;
        }

        public class DisputeCreateDto
        {
            public int? TransactionId { get; set; }

            [JsonConverter(typeof(JsonStringEnumConverter))]
            public DisputeStatus Status { get; set; }

            public int? RequisiteId { get; set; }
            public int? DeviceId { get; set; }

            public decimal DealAmount { get; set; }
            public List<string>? Files { get; set; } // ссылки/имена файлов (опц.)

            // Таймер: часы/минуты/секунды
            public int Hours { get; set; }
            public int Minutes { get; set; }
            public int Seconds { get; set; }
        }

        public class PrivateDisputeCreateDto : DisputeCreateDto
        {
            // Только для админа (создать спор не для себя)
            public int? UserId { get; set; }
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

        /* ----------------------- PUBLIC ----------------------- */

        private async Task<int> CloseExpiredPublicAsync(List<PublicDispute> entities)
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
            await CloseExpiredPublicAsync(list);

            var now = DateTime.UtcNow;

            var result = list.Select(x =>
            {
                int remaining = 0;
                if (x.Status == DisputeStatus.InProgress && x.TimerEndUtc.HasValue)
                    remaining = (int)Math.Max(0, Math.Ceiling((x.TimerEndUtc.Value - now).TotalSeconds));
                else if (x.Status == DisputeStatus.Frozen && x.PausedRemainingSeconds.HasValue)
                    remaining = Math.Max(0, x.PausedRemainingSeconds.Value);

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
                    RequisiteDisplay = FormatRequisite(x.Requisite),
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
                TimerEndUtc = dto.Status == DisputeStatus.InProgress ? now.AddSeconds(totalSeconds) : null,
                PausedRemainingSeconds = dto.Status == DisputeStatus.Frozen ? totalSeconds : null,
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

        /* ----------------------- PRIVATE ----------------------- */

        private async Task<int> CloseExpiredPrivateAsync(List<PrivateDispute> entities)
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

        // Пользователь видит ТОЛЬКО свои приватные споры.
        // Админ может получить чужие через ?userId=...
        [HttpGet("private")]
        [Authorize]
        public async Task<IActionResult> ListPrivate([FromQuery(Name = "statuses")] List<DisputeStatus>? statuses = null,
                                                     [FromQuery] int? transactionId = null,
                                                     [FromQuery] int? userId = null)
        {
            var isAdmin = User.IsInRole("admin");
            var currentUserId = GetCurrentUserId();

            if (!isAdmin)
            {
                if (!currentUserId.HasValue) return Forbid();
                userId = currentUserId.Value;
            }

            var q = _db.PrivateDisputes
                .Include(x => x.Requisite).ThenInclude(r => r.Owner).ThenInclude(o => o.User)
                .Include(x => x.Device).ThenInclude(d => d.User)
                .AsQueryable();

            if (userId.HasValue)
                q = q.Where(x => x.UserId == userId.Value);

            if (statuses is { Count: > 0 })
                q = q.Where(x => statuses.Contains(x.Status));
            if (transactionId.HasValue)
                q = q.Where(x => x.TransactionId == transactionId.Value);

            var list = await q.OrderByDescending(x => x.CreatedAt).ToListAsync();

            await CloseExpiredPrivateAsync(list);

            var now = DateTime.UtcNow;

            var result = list.Select(x =>
            {
                int remaining = 0;
                if (x.Status == DisputeStatus.InProgress && x.TimerEndUtc.HasValue)
                    remaining = (int)Math.Max(0, Math.Ceiling((x.TimerEndUtc.Value - now).TotalSeconds));
                else if (x.Status == DisputeStatus.Frozen && x.PausedRemainingSeconds.HasValue)
                    remaining = Math.Max(0, x.PausedRemainingSeconds.Value);

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
                    RequisiteDisplay = FormatRequisite(x.Requisite),
                    DeviceName = x.Device?.Name,
                    DealAmount = x.DealAmount,
                    Files = files,
                    RemainingSeconds = remaining
                };
            }).ToList();

            return Ok(result);
        }

        // ВАЖНО: приватные споры может создавать ТОЛЬКО АДМИН
        [HttpPost("private")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> CreatePrivate([FromBody] PrivateDisputeCreateDto dto)
        {
            var now = DateTime.UtcNow;

            // Если админ не передал userId — создадим для самого админа.
            var currentUserId = GetCurrentUserId();
            var targetUserId = dto.UserId ?? currentUserId
                ?? throw new InvalidOperationException("Не удалось определить UserId");

            var totalSeconds = Math.Max(0, dto.Hours * 3600 + dto.Minutes * 60 + dto.Seconds);

            var entity = new PrivateDispute
            {
                UserId = targetUserId,
                TransactionId = dto.TransactionId,
                Status = dto.Status,
                RequisiteId = dto.RequisiteId,
                DeviceId = dto.DeviceId,
                DealAmount = dto.DealAmount,
                FilesJson = dto.Files != null ? JsonSerializer.Serialize(dto.Files) : null,
                TimerEndUtc = dto.Status == DisputeStatus.InProgress ? now.AddSeconds(totalSeconds) : null,
                PausedRemainingSeconds = dto.Status == DisputeStatus.Frozen ? totalSeconds : null,
                CreatedAt = now,
                UpdatedAt = now
            };

            _db.PrivateDisputes.Add(entity);
            await _db.SaveChangesAsync();
            return Ok(new { id = entity.Id });
        }

        // Удалять может админ или владелец
        [HttpDelete("private/{id:int}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeletePrivate(int id)
        {
            var e = await _db.PrivateDisputes.FirstOrDefaultAsync(x => x.Id == id);
            if (e == null) return NotFound();

            var isAdmin = User.IsInRole("admin");
            var currentUserId = GetCurrentUserId();

            if (!isAdmin && (!currentUserId.HasValue || e.UserId != currentUserId.Value))
                return Forbid();

            _db.PrivateDisputes.Remove(e);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
