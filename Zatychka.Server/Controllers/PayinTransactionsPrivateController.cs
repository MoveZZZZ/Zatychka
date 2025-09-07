// Controllers/PayinTransactionsPrivateController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Zatychka.Server.Data;
using Zatychka.Server.DTOs;
using Zatychka.Server.Models;

namespace Zatychka.Server.Controllers
{
    [Route("api/payin/transactions/private")]
    [ApiController]
    public class PayinTransactionsPrivateController : ControllerBase
    {
        private readonly AppDbContext _db;
        public PayinTransactionsPrivateController(AppDbContext db) => _db = db;

        int? CurrentUserId()
        {
            var id = User.FindFirst("userID")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(id, out var uid) ? uid : (int?)null;
        }

        static string? FormatRequisite(OwnerRequisite? r)
        {
            if (r == null) return null;
            var val = r.Value ?? string.Empty;
            return r.Type switch
            {
                RequisiteType.Card => new string(val.Where(char.IsDigit).ToArray()) is var digits && digits.Length >= 4
                    ? $"Карта •••• {digits.Substring(digits.Length - 4)}"
                    : "Карта",
                RequisiteType.Phone => $"Телефон {val}",
                RequisiteType.Email => $"Email {val}",
                _ => val
            };
        }

        //[HttpGet]
        //[Authorize]
        //public async Task<IActionResult> List([FromQuery] int? id, [FromQuery] string? status,
        //                                      [FromQuery] int? userId = null, [FromQuery] string? userLogin = null,
        //                                      [FromQuery] int page = 1, [FromQuery] int pageSize = 50,
        //                                      [FromQuery] int? all = null) // флаг "показать все" для админа
        //{
        //    // базовый запрос
        //    var q = _db.PayinTransactionsPrivate
        //        .AsNoTracking()
        //        .Include(x => x.Requisite).ThenInclude(r => r.Owner).ThenInclude(o => o.User)
        //        .Include(x => x.Device).ThenInclude(d => d.User)
        //        .Include(x => x.User)
        //        .AsQueryable();

        //    // ОГРАНИЧЕНИЕ: последние 72 часа
        //    var sinceUtc = DateTime.UtcNow.Date.AddDays(-2);
        //    q = q.Where(x => x.Date >= sinceUtc);

        //    // фильтрация по владельцу
        //    var isAdmin = User.IsInRole("admin");
        //    var uid = CurrentUserId();

        //    if (isAdmin)
        //    {
        //        if (userId.HasValue)
        //        {
        //            q = q.Where(x => x.UserId == userId.Value);
        //        }
        //        else if (!string.IsNullOrWhiteSpace(userLogin))
        //        {
        //            q = q.Where(x => x.User.Login == userLogin);
        //        }
        //        else if (all == 1)
        //        {
        //            // админ явно запросил все (за последние 72 часа) — оставляем без доп. фильтра
        //        }
        //        else
        //        {
        //            // админ без фильтров → показываем ТОЛЬКО свои (за последние 72 часа)
        //            if (uid == null) return Unauthorized();
        //            q = q.Where(x => x.UserId == uid.Value);
        //        }
        //    }
        //    else
        //    {
        //        if (uid == null) return Unauthorized();
        //        q = q.Where(x => x.UserId == uid.Value);
        //    }

        //    // фильтр по id (узкоспециальный)
        //    if (id.HasValue) q = q.Where(x => x.Id == id.Value);

        //    // фильтр по статусам
        //    if (!string.IsNullOrWhiteSpace(status))
        //    {
        //        var list = status.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        //        if (list.Length == 1)
        //            q = q.Where(x => x.Status.ToString() == list[0]);
        //        else
        //            q = q.Where(x => list.Contains(x.Status.ToString()));
        //    }

        //    var total = await q.CountAsync();

        //    var data = await q
        //        .OrderByDescending(x => x.Date)
        //        .Skip((page - 1) * pageSize)
        //        .Take(pageSize)
        //        .ToListAsync();

        //    var items = data.Select(x => new
        //    {
        //        id = x.Id,
        //        date = x.Date,
        //        status = HumanizeStatus(x.Status.ToString()),
        //        dealAmount = x.DealAmount,
        //        incomeAmount = x.IncomeAmount,
        //        requisiteId = x.RequisiteId,
        //        deviceId = x.DeviceId,
        //        requisiteDisplay = FormatRequisite(x.Requisite),
        //        deviceName = x.Device?.Name,
        //        userId = x.UserId,
        //        userLogin = x.User?.Login
        //    });

        //    return Ok(new { items, total });
        //}

        //private static bool TryParsePayinStatus(string? s, out PayinStatus st)
        //{
        //    switch (s?.Trim())
        //    {
        //        case "Создана": st = PayinStatus.Created; return true;
        //        case "Выполнена": st = PayinStatus.Completed; return true;
        //        case "Заморожена": st = PayinStatus.Frozen; return true;
        //        default:
        //            return Enum.TryParse(s, ignoreCase: true, out st); 
        //    }
        //}
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> List([FromQuery] int? id, [FromQuery] string? status,
                                      [FromQuery] int? userId = null, [FromQuery] string? userLogin = null,
                                      [FromQuery] int page = 1, [FromQuery] int pageSize = 50,
                                      [FromQuery] int? all = null) // флаг "показать все" для админа
        {
            // базовый запрос
            var q = _db.PayinTransactionsPrivate
                .AsNoTracking()
                .Include(x => x.Requisite).ThenInclude(r => r.Owner).ThenInclude(o => o.User)
                .Include(x => x.Device).ThenInclude(d => d.User)
                .Include(x => x.User)
                .AsQueryable();

            // ⛔ УБРАНО прежнее ограничение "последние 72 часа"

            // фильтрация по владельцу
            var isAdmin = User.IsInRole("admin");
            var uid = CurrentUserId();

            if (isAdmin)
            {
                if (userId.HasValue)
                {
                    q = q.Where(x => x.UserId == userId.Value);
                }
                else if (!string.IsNullOrWhiteSpace(userLogin))
                {
                    q = q.Where(x => x.User.Login == userLogin);
                }
                else if (all == 1)
                {
                    // админ явно запросил все — оставляем без доп. фильтра
                }
                else
                {
                    // админ без фильтров → показываем ТОЛЬКО свои
                    if (uid == null) return Unauthorized();
                    q = q.Where(x => x.UserId == uid.Value);
                }
            }
            else
            {
                if (uid == null) return Unauthorized();
                q = q.Where(x => x.UserId == uid.Value);
            }

            // фильтр по id (узкоспециальный)
            if (id.HasValue) q = q.Where(x => x.Id == id.Value);

            // фильтр по статусам
            if (!string.IsNullOrWhiteSpace(status))
            {
                var list = status.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                if (list.Length == 1)
                    q = q.Where(x => x.Status.ToString() == list[0]);
                else
                    q = q.Where(x => list.Contains(x.Status.ToString()));
            }

            // ✅ НОВОЕ ОГРАНИЧЕНИЕ: берём три последние ДАТЫ (последний день + 2 предыдущих дня с данными)
            var lastThreeDays = await q
                .Select(t => t.Date.Date)     // дата без времени
                .Distinct()
                .OrderByDescending(d => d)
                .Take(3)
                .ToListAsync();

            if (lastThreeDays.Count == 0)
            {
                return Ok(new { items = Array.Empty<object>(), total = 0 });
            }

            q = q.Where(t => lastThreeDays.Contains(t.Date.Date));

            var total = await q.CountAsync();

            var data = await q
                .OrderByDescending(x => x.Date)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var items = data.Select(x => new
            {
                id = x.Id,
                date = x.Date,
                status = HumanizeStatus(x.Status.ToString()),
                dealAmount = x.DealAmount,
                incomeAmount = x.IncomeAmount,
                requisiteId = x.RequisiteId,
                deviceId = x.DeviceId,
                requisiteDisplay = FormatRequisite(x.Requisite),
                deviceName = x.Device?.Name,
                userId = x.UserId,
                userLogin = x.User?.Login
            });

            return Ok(new { items, total });
        }

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Create([FromBody] PayinTransactionPrivateUpsertDto dto)
        {
            if (!TryParsePayinStatus(dto.Status, out var status))
                return BadRequest(new { error = "Недопустимый статус", got = dto.Status });

            if (!await _db.Users.AnyAsync(u => u.Id == dto.UserId))
                return BadRequest(new { error = "Пользователь не найден", userId = dto.UserId });

            var e = new PayinTransactionPrivate
            {
                UserId = dto.UserId,
                Date = dto.Date,
                Status = status,
                RequisiteId = dto.RequisiteId,
                DeviceId = dto.DeviceId,
                DealAmount = dto.DealAmount,
                IncomeAmount = dto.IncomeAmount
            };


            _db.PayinTransactionsPrivate.Add(e);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = e.Id,
                date = e.Date,
                status = HumanizeStatus(e.Status.ToString()),
                dealAmount = e.DealAmount,
                incomeAmount = e.IncomeAmount,
                requisiteId = e.RequisiteId,
                deviceId = e.DeviceId,
                userId = e.UserId
            });
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var e = await _db.PayinTransactionsPrivate.FirstOrDefaultAsync(x => x.Id == id);
            if (e == null) return NotFound();

            _db.PayinTransactionsPrivate.Remove(e);
            await _db.SaveChangesAsync();
            return NoContent();
        }
       public string HumanizeStatus(string status)
        {
            string status_return = "";
            if (status == "Created")
            {
                status_return = "Создана";
            }
            else if (status == "InProgress")
            {
                status_return = "В процессе";
            }
            else if (status == "Completed")
            {
                status_return = "Выполнена";
            }
            else
            {
                status_return = "Заморожена";
            }
            return status_return;
        }
    }
}
