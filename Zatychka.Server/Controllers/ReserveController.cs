using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Security.Claims;
using Zatychka.Server.Data;
using Zatychka.Server.DTOs;
using Zatychka.Server.Models;

namespace Zatychka.Server.Controllers
{
    [ApiController]
    [Route("api/reserve")]
    [Authorize]
    public class ReserveController : ControllerBase
    {
        private readonly AppDbContext _db;
        public ReserveController(AppDbContext db) => _db = db;

        // Возвращаем СТРОКОВЫЙ user id (модели у тебя со string UserId)
        private string? CurrentUserId()
        {
            var raw = User.FindFirst("userID")?.Value
                      ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                      ?? User.FindFirst("nameid")?.Value
                      ?? User.FindFirst("sub")?.Value;

            return string.IsNullOrWhiteSpace(raw) ? null : raw.Trim();
        }

        // ---------- PUBLIC ----------
        [HttpGet("public")]
        public ActionResult<ReserveDto> GetPublic()
        {
            var r = _db.PublicReserves.FirstOrDefault()
                    ?? new PublicReserve { Id = 1, Amount = 0m, UpdatedAt = DateTimeOffset.UtcNow };

            return Ok(new ReserveDto("public", r.Amount, r.UpdatedAt.UtcDateTime.ToString("O")));
        }

        [HttpPut("public")]
        [Authorize(Policy = "AdminOnly")]
        public ActionResult<ReserveDto> PutPublic([FromBody] UpdateReserveAmountDto dto)
        {
            var r = _db.PublicReserves.FirstOrDefault();
            if (r == null)
            {
                r = new PublicReserve { Id = 1, Amount = dto.Amount, UpdatedAt = DateTimeOffset.UtcNow };
                _db.PublicReserves.Add(r);
            }
            else
            {
                r.Amount = dto.Amount;
                r.UpdatedAt = DateTimeOffset.UtcNow;
            }

            _db.SaveChanges();
            return Ok(new ReserveDto("public", r.Amount, r.UpdatedAt.UtcDateTime.ToString("O")));
        }

        // ---------- PRIVATE ----------
        [HttpGet("private/my")]
        [Authorize(Policy = "AdminOnly")]
        public ActionResult<ReserveDto> GetMyPrivate()
        {
            var userId = CurrentUserId();
            if (userId is null) return Forbid();

            var r = _db.PrivateReserves.AsNoTracking().FirstOrDefault(x => x.UserId == userId)
                    ?? new PrivateReserve { UserId = userId, Amount = 0m, UpdatedAt = DateTimeOffset.UtcNow };

            return Ok(new ReserveDto("private", r.Amount, r.UpdatedAt.UtcDateTime.ToString("O")));
        }

        [HttpPut("private/my")]
        [Authorize(Policy = "AdminOnly")]
        public ActionResult<ReserveDto> PutMyPrivate([FromBody] UpdateReserveAmountDto dto)
        {
            var userId = CurrentUserId();
            if (userId is null) return Forbid();

            // Берём ТОЛЬКО Id существующей записи (без трекинга)
            var existingId = _db.PrivateReserves
                                .AsNoTracking()
                                .Where(x => x.UserId == userId)
                                .Select(x => x.Id)
                                .FirstOrDefault(); // 0 если нет

            if (existingId != 0)
            {
                // Обновляем без повторного select всей сущности
                var entity = new PrivateReserve
                {
                    Id = existingId,
                    UserId = userId,                // оставляем прежний
                    Amount = dto.Amount,
                    UpdatedAt = DateTimeOffset.UtcNow
                };

                _db.PrivateReserves.Attach(entity);
                _db.Entry(entity).Property(x => x.Amount).IsModified = true;
                _db.Entry(entity).Property(x => x.UpdatedAt).IsModified = true;
            }
            else
            {
                // Вставка новой записи
                _db.PrivateReserves.Add(new PrivateReserve
                {
                    UserId = userId,
                    Amount = dto.Amount,
                    UpdatedAt = DateTimeOffset.UtcNow
                });
            }

            _db.SaveChanges();

            // Возвращаем актуальное значение
            return Ok(new ReserveDto("private", dto.Amount, DateTimeOffset.UtcNow.UtcDateTime.ToString("O")));
        }
    }
}
