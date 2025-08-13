using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Zatychka.Server.Data;
using Zatychka.Server.DTOs;
using Zatychka.Server.Models;

namespace Zatychka.Server.Controllers
{
    [Route("api/payin/transactions/public")]
    [ApiController]
    public class PayinTransactionsController : ControllerBase
    {
        private readonly AppDbContext _db;
        public PayinTransactionsController(AppDbContext db) => _db = db;

        static string? FormatRequisite(OwnerRequisite? r)
        {
            if (r == null) return null;
            var val = r.Value ?? string.Empty;
            switch (r.Type)
            {
                case RequisiteType.Card:
                    var digits = new string(val.Where(char.IsDigit).ToArray());
                    var last4 = digits.Length >= 4 ? digits.Substring(digits.Length - 4) : null;
                    return last4 != null ? $"Карта •••• {last4}" : "Карта";
                case RequisiteType.Phone:
                    return $"Телефон {val}";
                case RequisiteType.Email:
                    return $"Email {val}";
                default:
                    return val;
            }
        }


        [HttpGet]
        [Authorize]
        public async Task<IActionResult> List([FromQuery] int? id, [FromQuery] string? status,
                                              [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var q = _db.PayinTransactionsPublic
                .AsNoTracking()
                .Include(x => x.Requisite).ThenInclude(r => r.Owner).ThenInclude(o => o.User)
                .Include(x => x.Device).ThenInclude(d => d.User)
                .AsQueryable();

            if (id.HasValue) q = q.Where(x => x.Id == id.Value);
            if (!string.IsNullOrWhiteSpace(status)) q = q.Where(x => x.Status == status);

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
                status = x.Status,
                dealAmount = x.DealAmount,
                incomeAmount = x.IncomeAmount,
                requisiteId = x.RequisiteId,
                deviceId = x.DeviceId,
                requisiteDisplay = FormatRequisite(x.Requisite),
                deviceName = x.Device?.Name
            });

            return Ok(new { items, total });
        }


        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Create([FromBody] PayinTransactionUpsertDto dto)
        {
            var allowed = new[] { "Создана", "В процессе", "Выполнена", "Заморожена" };
            if (!allowed.Contains(dto.Status)) return BadRequest("Недопустимый статус");

            var e = new PayinTransactionPublic
            {
                Date = dto.Date,
                Status = dto.Status,
                RequisiteId = dto.RequisiteId,
                DeviceId = dto.DeviceId,
                DealAmount = dto.DealAmount,
                IncomeAmount = dto.IncomeAmount
            };

            _db.PayinTransactionsPublic.Add(e);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = e.Id,
                date = e.Date,
                status = e.Status,
                dealAmount = e.DealAmount,
                incomeAmount = e.IncomeAmount,
                requisiteId = e.RequisiteId,
                deviceId = e.DeviceId
            });
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var e = await _db.PayinTransactionsPublic.FirstOrDefaultAsync(x => x.Id == id);
            if (e == null) return NotFound();

            _db.PayinTransactionsPublic.Remove(e);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
