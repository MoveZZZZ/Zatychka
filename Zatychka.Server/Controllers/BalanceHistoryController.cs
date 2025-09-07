using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json.Serialization;
using Zatychka.Server.Data;
using Zatychka.Server.Models;

namespace Zatychka.Server.Controllers
{
    [Route("api/balance/history")]
    [ApiController]
    public class BalanceHistoryController : ControllerBase
    {
        private readonly AppDbContext _db;
        public BalanceHistoryController(AppDbContext db) => _db = db;

        int? CurrentUserId()
        {
            var id = User.FindFirst("userID")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(id, out var uid) ? uid : (int?)null;
        }

        // ===== DTOs =====
        public class SimpleUpsertDto
        {
            public DateTime? Date { get; set; }

            [JsonConverter(typeof(JsonStringEnumConverter))]
            public BalanceChangeType Type { get; set; }

            public decimal Amount { get; set; }
            public decimal BalanceBefore { get; set; }
            public decimal BalanceAfter { get; set; }

            public int? UserId { get; set; } // для private (админ)
        }

        public class FrozenUpsertDto
        {
            public DateTime? FreezeDate { get; set; }
            public DateTime? UnfreezeDate { get; set; }

            [JsonConverter(typeof(JsonStringEnumConverter))]
            public BalanceChangeType Type { get; set; }

            public decimal Amount { get; set; }

            public int? UserId { get; set; } // для private (админ)
        }

        // ====== SIMPLE: PUBLIC ======
        [HttpGet("simple/public")]
        [Authorize]
        public async Task<IActionResult> GetSimplePublic([FromQuery(Name = "types")] List<BalanceChangeType>? types = null)
        {
            var q = _db.BalanceChanges.AsNoTracking().Where(x => x.UserId == null);

            if (types != null && types.Count > 0)
                q = q.Where(x => types.Contains(x.Type));

            var list = await q/*.OrderByDescending(x => x.Date)*/
                .Select(x => new {
                    id = x.Id,
                    date = x.Date,
                    type = x.Type.ToString(),
                    amount = x.Amount,
                    before = x.BalanceBefore,
                    after = x.BalanceAfter
                }).ToListAsync();

            return Ok(list);
        }

        [HttpPost("simple/public")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> CreateSimplePublic([FromBody] SimpleUpsertDto dto)
        {
            var e = new BalanceChange
            {
                UserId = null,
                Date = dto.Date ?? DateTime.UtcNow,
                Type = dto.Type,
                Amount = dto.Amount,
                BalanceBefore = dto.BalanceBefore,
                BalanceAfter = dto.BalanceAfter
            };
            _db.BalanceChanges.Add(e);
            await _db.SaveChangesAsync();
            return Ok(new { id = e.Id });
        }

        [HttpDelete("simple/public/{id:int}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteSimplePublic(int id)
        {
            var e = await _db.BalanceChanges.FirstOrDefaultAsync(x => x.Id == id && x.UserId == null);
            if (e == null) return NotFound();
            _db.BalanceChanges.Remove(e);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // ====== SIMPLE: PRIVATE (мой) ======
        [HttpGet("simple/private")]
        [Authorize]
        public async Task<IActionResult> GetSimplePrivate([FromQuery(Name = "types")] List<BalanceChangeType>? types = null)
        {
            var uid = CurrentUserId();
            if (uid == null) return Unauthorized();

            var q = _db.BalanceChanges.AsNoTracking().Where(x => x.UserId == uid);

            if (types != null && types.Count > 0)
                q = q.Where(x => types.Contains(x.Type));

            var list = await q/*.OrderByDescending(x => x.Date)*/
                .Select(x => new {
                    id = x.Id,
                    date = x.Date,
                    type = x.Type.ToString(),
                    amount = x.Amount,
                    before = x.BalanceBefore,
                    after = x.BalanceAfter
                }).ToListAsync();

            return Ok(list);
        }

        [HttpPost("simple/private")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> CreateSimplePrivate([FromBody] SimpleUpsertDto dto)
        {
            if (dto.UserId == null) return BadRequest("UserId обязателен для private.");

            var e = new BalanceChange
            {
                UserId = dto.UserId,
                Date = dto.Date ?? DateTime.UtcNow,
                Type = dto.Type,
                Amount = dto.Amount,
                BalanceBefore = dto.BalanceBefore,
                BalanceAfter = dto.BalanceAfter
            };
            _db.BalanceChanges.Add(e);
            await _db.SaveChangesAsync();
            return Ok(new { id = e.Id });
        }

        [HttpDelete("simple/private/{id:int}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteSimplePrivate(int id)
        {
            var e = await _db.BalanceChanges.FirstOrDefaultAsync(x => x.Id == id && x.UserId != null);
            if (e == null) return NotFound();
            _db.BalanceChanges.Remove(e);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // ====== FROZEN: PUBLIC ======
        [HttpGet("frozen/public")]
        [Authorize]
        public async Task<IActionResult> GetFrozenPublic([FromQuery(Name = "types")] List<BalanceChangeType>? types = null)
        {
            var q = _db.FrozenBalanceChanges.AsNoTracking().Where(x => x.UserId == null);

            if (types != null && types.Count > 0)
                q = q.Where(x => types.Contains(x.Type));

            var list = await q.OrderByDescending(x => x.FreezeDate)
                .Select(x => new {
                    id = x.Id,
                    freezeDate = x.FreezeDate,
                    unfreezeDate = x.UnfreezeDate,
                    type = x.Type.ToString(),
                    amount = x.Amount
                }).ToListAsync();

            return Ok(list);
        }

        [HttpPost("frozen/public")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> CreateFrozenPublic([FromBody] FrozenUpsertDto dto)
        {
            var e = new FrozenBalanceChange
            {
                UserId = null,
                FreezeDate = dto.FreezeDate ?? DateTime.UtcNow,
                UnfreezeDate = dto.UnfreezeDate,
                Type = dto.Type,
                Amount = dto.Amount
            };
            _db.FrozenBalanceChanges.Add(e);
            await _db.SaveChangesAsync();
            return Ok(new { id = e.Id });
        }

        [HttpDelete("frozen/public/{id:int}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteFrozenPublic(int id)
        {
            var e = await _db.FrozenBalanceChanges.FirstOrDefaultAsync(x => x.Id == id && x.UserId == null);
            if (e == null) return NotFound();
            _db.FrozenBalanceChanges.Remove(e);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // ====== FROZEN: PRIVATE (мой) ======
        [HttpGet("frozen/private")]
        [Authorize]
        public async Task<IActionResult> GetFrozenPrivate([FromQuery(Name = "types")] List<BalanceChangeType>? types = null)
        {
            var uid = CurrentUserId();
            if (uid == null) return Unauthorized();

            var q = _db.FrozenBalanceChanges.AsNoTracking().Where(x => x.UserId == uid);

            if (types != null && types.Count > 0)
                q = q.Where(x => types.Contains(x.Type));

            var list = await q.OrderByDescending(x => x.FreezeDate)
                .Select(x => new {
                    id = x.Id,
                    freezeDate = x.FreezeDate,
                    unfreezeDate = x.UnfreezeDate,
                    type = x.Type.ToString(),
                    amount = x.Amount
                }).ToListAsync();

            return Ok(list);
        }

        [HttpPost("frozen/private")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> CreateFrozenPrivate([FromBody] FrozenUpsertDto dto)
        {
            if (dto.UserId == null) return BadRequest("UserId обязателен для private.");

            var e = new FrozenBalanceChange
            {
                UserId = dto.UserId,
                FreezeDate = dto.FreezeDate ?? DateTime.UtcNow,
                UnfreezeDate = dto.UnfreezeDate,
                Type = dto.Type,
                Amount = dto.Amount
            };
            _db.FrozenBalanceChanges.Add(e);
            await _db.SaveChangesAsync();
            return Ok(new { id = e.Id });
        }

        [HttpDelete("frozen/private/{id:int}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteFrozenPrivate(int id)
        {
            var e = await _db.FrozenBalanceChanges.FirstOrDefaultAsync(x => x.Id == id && x.UserId != null);
            if (e == null) return NotFound();
            _db.FrozenBalanceChanges.Remove(e);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
