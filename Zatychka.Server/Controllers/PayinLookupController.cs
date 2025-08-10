using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Zatychka.Server.Data;
using Zatychka.Server.Models;

namespace Zatychka.Server.Controllers
{
    [Route("api/payin/lookup")]
    [ApiController]
    public class PayinLookupController : ControllerBase
    {
        private readonly AppDbContext _db;
        public PayinLookupController(AppDbContext db) => _db = db;

        private static string? FormatRequisite(OwnerRequisite? r)
        {
            if (r == null) return null;
            var val = r.Value ?? string.Empty;
            switch (r.Type)
            {
                case RequisiteType.Card:
                    var digits = new string(val.Where(char.IsDigit).ToArray());
                    var last4 = digits.Length >= 4 ? digits.Substring(digits.Length - 4) : null;
                    return last4 != null ? $"Карта •••• {last4}" : "Карта";
                case RequisiteType.Phone: return $"Телефон {val}";
                case RequisiteType.Email: return $"Email {val}";
                default: return val;
            }
        }

        // Реквизиты по логину владельца
        [HttpGet("requisites")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Requisites([FromQuery] string? login = null, [FromQuery] int take = 20)
        {
            var q = _db.OwnerRequisites
                .Include(r => r.Owner).ThenInclude(o => o.User)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(login))
                q = q.Where(r => r.Owner.User.Login.Contains(login));

            var list = await q.OrderBy(r => r.Id).Take(take).ToListAsync();

            var items = list.Select(r => new
            {
                id = r.Id,
                ownerLogin = r.Owner?.User?.Login,
                display = FormatRequisite(r)
            });

            return Ok(items);
        }

        // Устройства по логину владельца
        [HttpGet("devices")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Devices([FromQuery] string? login = null, [FromQuery] int take = 20)
        {
            var q = _db.Devices.Include(d => d.User).AsQueryable();

            if (!string.IsNullOrWhiteSpace(login))
                q = q.Where(d => d.User.Login.Contains(login));

            var items = await q.OrderBy(d => d.Id).Take(take)
                .Select(d => new
                {
                    id = d.Id,
                    ownerLogin = d.User != null ? d.User.Login : null,
                    name = d.Name
                })
                .ToListAsync();

            return Ok(items);
        }
    }
}
