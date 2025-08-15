using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.RegularExpressions;
using Zatychka.Server.Data;
using Zatychka.Server.Models;

namespace Zatychka.Server.Controllers
{
    [Route("api/telegram-links")]
    [ApiController]
    public class TelegramLinksController : ControllerBase
    {
        private readonly AppDbContext _db;
        public TelegramLinksController(AppDbContext db) => _db = db;

        private static readonly Regex TgUserRe =
            new(@"^(?:https?:\/\/)?(?:t\.me\/|telegram\.me\/)?@?([A-Za-z0-9_]{5,32})$",
                RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static string NormalizeUsername(string input)
        {
            input = (input ?? string.Empty).Trim();
            var m = TgUserRe.Match(input);
            if (!m.Success) throw new ArgumentException("Укажите корректный Telegram username или ссылку вида https://t.me/<username>");
            return m.Groups[1].Value; // без @
        }

        int? CurrentUserId()
        {
            var id = User.FindFirst("userID")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(id, out var uid) ? uid : (int?)null;
        }

        public class AdminUpsertDto
        {
            public int UserId { get; set; }
            public string Telegram { get; set; } = null!;
            public long? TelegramUserId { get; set; }
        }

        public class LinkDto
        {
            public string Username { get; set; } = null!;
            public string Url => $"https://t.me/{Username}";
        }

        /* ---------- Запросы для текущего пользователя ---------- */

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMine()
        {
            var uid = CurrentUserId();
            if (!uid.HasValue) return Unauthorized();
            var link = await _db.TelegramLinks.AsNoTracking()
                           .FirstOrDefaultAsync(x => x.UserId == uid.Value);
            if (link == null) return Ok(null);
            return Ok(new LinkDto { Username = link.Username });
        }


        [HttpGet("by-user/{userId:int}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetByUser(int userId)
        {
            var link = await _db.TelegramLinks.AsNoTracking()
                           .FirstOrDefaultAsync(x => x.UserId == userId);
            if (link == null) return Ok(null);
            return Ok(new LinkDto { Username = link.Username });
        }

        // POST /api/telegram-links (admin upsert)
        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Upsert([FromBody] AdminUpsertDto dto)
        {
            if (dto.UserId <= 0) return BadRequest("Некорректный userId");
            var username = NormalizeUsername(dto.Telegram).ToLowerInvariant();

            // проверка уникальности username
            var existsOther = await _db.TelegramLinks
                .AnyAsync(x => x.Username.ToLower() == username && x.UserId != dto.UserId);
            if (existsOther) return Conflict("Этот Telegram username уже привязан к другому пользователю");

            var now = DateTime.UtcNow;
            var link = await _db.TelegramLinks.FirstOrDefaultAsync(x => x.UserId == dto.UserId);
            if (link == null)
            {
                link = new UserTelegramLink
                {
                    UserId = dto.UserId,
                    Username = username,
                    TelegramUserId = dto.TelegramUserId,
                    Source = "admin",
                    CreatedAt = now,
                    UpdatedAt = now
                };
                _db.TelegramLinks.Add(link);
            }
            else
            {
                link.Username = username;
                link.TelegramUserId = dto.TelegramUserId;
                link.Source = "admin";
                link.UpdatedAt = now;
            }

            await _db.SaveChangesAsync();
            return Ok(new LinkDto { Username = link.Username });
        }

        // DELETE /api/telegram-links/123  (по userId)
        [HttpDelete("{userId:int}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Unlink(int userId)
        {
            var link = await _db.TelegramLinks.FirstOrDefaultAsync(x => x.UserId == userId);
            if (link == null) return NotFound();
            _db.TelegramLinks.Remove(link);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
