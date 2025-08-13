using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Zatychka.Server.Data;
using Zatychka.Server.DTOs;
using Zatychka.Server.DTOs.Links;
using Zatychka.Server.Models;
using Zatychka.Server.Repositories;

namespace Zatychka.Server.Controllers
{
    [ApiController]
    [Route("api/links")]
    [Authorize]
    public class LinksController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILinkRepository _repo;

        public LinksController(AppDbContext db, ILinkRepository repo)
        {
            _db = db;
            _repo = repo;
        }

        private int? CurrentUserId()
            => int.TryParse(User.FindFirst("userID")?.Value, out var id) ? id : null;

        private static string MaskRequisite(OwnerRequisite r)
        {
            var type = r.Type.ToString(); // Card / Phone / Email
            string label = type;
            if (r.Type == RequisiteType.Card)
            {
                var val = r.Value ?? "";
                var last4 = val.Length >= 4 ? val[^4..] : val;
                label = $"Карта •••• {last4}";
            }
            else if (r.Type == RequisiteType.Phone)
            {
                var v = r.Value ?? "";
                // простая маска
                label = $"Телефон {v}";
            }
            else if (r.Type == RequisiteType.Email)
            {
                label = $"Email {r.Value}";
            }
            return label;
        }

        [HttpGet]
        public async Task<IActionResult> List()
        {
            var uid = CurrentUserId();
            if (uid == null) return Unauthorized();

            var list = await _repo.ListByUserAsync(uid.Value);
            var dto = list.Select(l => new LinkListItemDto
            {
                Id = l.Id,
                DeviceId = l.DeviceId,
                DeviceName = l.Device.Name,
                RequisiteId = l.RequisiteId,
                RequisiteLabel = MaskRequisite(l.Requisite),
                MinAmountUsdt = l.MinAmountUsdt,
                MaxAmountUsdt = l.MaxAmountUsdt,
                DailyTxCountLimit = l.DailyTxCountLimit,
                MonthlyTxCountLimit = l.MonthlyTxCountLimit,
                TotalTxCountLimit = l.TotalTxCountLimit,
                DailyAmountLimitUsdt = l.DailyAmountLimitUsdt,
                MonthlyAmountLimitUsdt = l.MonthlyAmountLimitUsdt,
                TotalAmountLimitUsdt = l.TotalAmountLimitUsdt,
                MaxConcurrentTransactions = l.MaxConcurrentTransactions,
                MinMinutesBetweenTransactions = l.MinMinutesBetweenTransactions,
                IsActive = l.IsActive
            }).ToList();

            return Ok(dto);
        }

        // удобный эндпоинт для модалки (списки устройств и реквизитов пользователя)
        [HttpGet("options")]
        public async Task<IActionResult> Options()
        {
            var uid = CurrentUserId();
            if (uid == null) return Unauthorized();

            var devices = await _db.Devices
                .AsNoTracking()
                .Where(d => d.UserId == uid.Value)
                .OrderBy(d => d.Name)
                .Select(d => new { d.Id, d.Name })
                .ToListAsync();

            var requisites = await _db.OwnerRequisites
                .AsNoTracking()
                .Include(x => x.Owner)
                .Where(r => r.Owner.UserId == uid.Value)
                .OrderByDescending(r => r.Id)
                .Select(r => new
                {
                    r.Id,
                    Label = MaskRequisite(r)
                })
                .ToListAsync();

            return Ok(new { devices, requisites });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateLinkRequest req)
        {
            var uid = CurrentUserId();
            if (uid == null) return Unauthorized();

            if (req.MinAmountUsdt < 0 || req.MaxAmountUsdt <= 0 || req.MinAmountUsdt > req.MaxAmountUsdt)
                return BadRequest(new { message = "Неверные min/max суммы." });

            // Проверяем устройство владельца
            var device = await _db.Devices.FirstOrDefaultAsync(d => d.Id == req.DeviceId && d.UserId == uid.Value);
            if (device == null) return BadRequest(new { message = "Устройство не найдено." });

            // Проверяем реквизит владельца
            var requisite = await _db.OwnerRequisites
                .Include(r => r.Owner)
                .FirstOrDefaultAsync(r => r.Id == req.RequisiteId && r.Owner.UserId == uid.Value);
            if (requisite == null) return BadRequest(new { message = "Реквизит не найден." });

            var link = new Link
            {
                UserId = uid.Value,
                DeviceId = req.DeviceId,
                RequisiteId = req.RequisiteId,
                MinAmountUsdt = req.MinAmountUsdt,
                MaxAmountUsdt = req.MaxAmountUsdt,
                DailyTxCountLimit = req.DailyTxCountLimit,
                MonthlyTxCountLimit = req.MonthlyTxCountLimit,
                TotalTxCountLimit = req.TotalTxCountLimit,
                DailyAmountLimitUsdt = req.DailyAmountLimitUsdt,
                MonthlyAmountLimitUsdt = req.MonthlyAmountLimitUsdt,
                TotalAmountLimitUsdt = req.TotalAmountLimitUsdt,
                MaxConcurrentTransactions = req.MaxConcurrentTransactions,
                MinMinutesBetweenTransactions = req.MinMinutesBetweenTransactions,
                IsActive = req.IsActive ?? true
            };

            await _repo.AddAsync(link);

            // вернем компактный DTO
            return Ok(new
            {
                id = link.Id
            });
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateLinkRequest req)
        {
            var uid = CurrentUserId();
            if (uid == null) return Unauthorized();

            var link = await _repo.GetByIdAsync(id, uid.Value);
            if (link == null) return NotFound(new { message = "Связка не найдена." });

            // если меняем устройство/реквизит — валидируем принадлежность
            if (req.DeviceId.HasValue)
            {
                var d = await _db.Devices.FirstOrDefaultAsync(x => x.Id == req.DeviceId.Value && x.UserId == uid.Value);
                if (d == null) return BadRequest(new { message = "Устройство не найдено." });
                link.DeviceId = req.DeviceId.Value;
            }

            if (req.RequisiteId.HasValue)
            {
                var r = await _db.OwnerRequisites
                    .Include(x => x.Owner)
                    .FirstOrDefaultAsync(x => x.Id == req.RequisiteId.Value && x.Owner.UserId == uid.Value);
                if (r == null) return BadRequest(new { message = "Реквизит не найден." });
                link.RequisiteId = req.RequisiteId.Value;
            }

            if (req.MinAmountUsdt.HasValue) link.MinAmountUsdt = req.MinAmountUsdt.Value;
            if (req.MaxAmountUsdt.HasValue) link.MaxAmountUsdt = req.MaxAmountUsdt.Value;

            if (link.MinAmountUsdt < 0 || link.MaxAmountUsdt <= 0 || link.MinAmountUsdt > link.MaxAmountUsdt)
                return BadRequest(new { message = "Неверные min/max суммы." });

            link.DailyTxCountLimit = req.DailyTxCountLimit ?? link.DailyTxCountLimit;
            link.MonthlyTxCountLimit = req.MonthlyTxCountLimit ?? link.MonthlyTxCountLimit;
            link.TotalTxCountLimit = req.TotalTxCountLimit ?? link.TotalTxCountLimit;

            link.DailyAmountLimitUsdt = req.DailyAmountLimitUsdt ?? link.DailyAmountLimitUsdt;
            link.MonthlyAmountLimitUsdt = req.MonthlyAmountLimitUsdt ?? link.MonthlyAmountLimitUsdt;
            link.TotalAmountLimitUsdt = req.TotalAmountLimitUsdt ?? link.TotalAmountLimitUsdt;

            link.MaxConcurrentTransactions = req.MaxConcurrentTransactions ?? link.MaxConcurrentTransactions;
            link.MinMinutesBetweenTransactions = req.MinMinutesBetweenTransactions ?? link.MinMinutesBetweenTransactions;

            if (req.IsActive.HasValue) link.IsActive = req.IsActive.Value;

            await _repo.UpdateAsync(link);
            return Ok(new { message = "Обновлено" });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var uid = CurrentUserId();
            if (uid == null) return Unauthorized();

            var link = await _repo.GetByIdAsync(id, uid.Value);
            if (link == null) return NotFound(new { message = "Связка не найдена." });

            await _repo.DeleteAsync(link);
            return Ok(new { message = "Удалено" });
        }

        [HttpGet("search")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Search([FromQuery] string? login = null, [FromQuery] bool? activeOnly = null, [FromQuery] int take = 200)
        {
            var q = _db.Links
                .Include(l => l.User)
                .Include(l => l.Device)
                .Include(l => l.Requisite).ThenInclude(r => r.Owner).ThenInclude(o => o.User)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(login))
                q = q.Where(l => l.User.Login.Contains(login));

            if (activeOnly == true)
                q = q.Where(l => l.IsActive);

            var list = await q
                .OrderByDescending(l => l.IsActive).ThenBy(l => l.Id)
                .Take(take)
                .Select(l => new LinkListItemDtoTRANS
                {
                    Id = l.Id,
                    UserLogin = l.User.Login,
                    DeviceName = l.Device.Name,
                    RequisiteDisplay = MaskRequisite(l.Requisite),
                    IsActive = l.IsActive,
                    MinAmountUsdt = l.MinAmountUsdt,
                    MaxAmountUsdt = l.MaxAmountUsdt,
                    DailyTxCountLimit = l.DailyTxCountLimit,
                    MonthlyTxCountLimit = l.MonthlyTxCountLimit,
                    TotalTxCountLimit = l.TotalTxCountLimit,
                    MaxConcurrentTransactions = l.MaxConcurrentTransactions,
                    MinMinutesBetweenTransactions = l.MinMinutesBetweenTransactions
                })
                .ToListAsync();

            return Ok(list);
        }
    }
}
