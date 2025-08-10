using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;
using Zatychka.Server.DTOs;
using Zatychka.Server.Models;
using Zatychka.Server.Repositories;

namespace Zatychka.Server.Controllers
{
    [ApiController]
    [Route("api/owners")]
    [Authorize]
    public class OwnersController : ControllerBase
    {
        private readonly IOwnerRepository _ownerRepo;
        private readonly IRequisiteRepository _reqRepo;

        public OwnersController(IOwnerRepository ownerRepo, IRequisiteRepository reqRepo)
        {
            _ownerRepo = ownerRepo;
            _reqRepo = reqRepo;
        }

        private int? CurrentUserId()
            => int.TryParse(User.FindFirst("userID")?.Value, out var id) ? id : (int?)null;

        [HttpGet]
        public async Task<IActionResult> GetOwners()
        {
            var uid = CurrentUserId();
            if (uid is null) return Unauthorized();

            var list = await _ownerRepo.GetForUserAsync(uid.Value);

            var dto = list.Select(o => new OwnerDto
            {
                Id = o.Id,
                FirstName = o.FirstName,
                LastName = o.LastName,
                MiddleName = o.MiddleName,
                BankName = o.BankName,
                Requisites = o.Requisites.Select(r => new RequisiteDto
                {
                    Id = r.Id,
                    Type = r.Type.ToString().ToLower(),
                    Value = r.Value
                }).ToList()
            });

            return Ok(dto);
        }

        [HttpPost]
        public async Task<IActionResult> CreateOwner([FromBody] CreateOwnerRequest request)
        {
            var uid = CurrentUserId();
            if (uid is null) return Unauthorized();

            if (string.IsNullOrWhiteSpace(request.FirstName) ||
                string.IsNullOrWhiteSpace(request.LastName) ||
                string.IsNullOrWhiteSpace(request.BankName))
            {
                return BadRequest(new { message = "FirstName, LastName и BankName обязательны." });
            }

            var owner = new Owner
            {
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                MiddleName = string.IsNullOrWhiteSpace(request.MiddleName) ? null : request.MiddleName.Trim(),
                BankName = request.BankName.Trim(),
                UserId = uid.Value
            };

            await _ownerRepo.AddAsync(owner);

            return Ok(new { id = owner.Id });
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateOwner(int id, [FromBody] UpdateOwnerRequest request)
        {
            var uid = CurrentUserId();
            if (uid is null) return Unauthorized();

            var owner = await _ownerRepo.GetByIdAsync(id, uid.Value);
            if (owner == null) return NotFound();

            if (request.FirstName != null) owner.FirstName = request.FirstName.Trim();
            if (request.LastName != null) owner.LastName = request.LastName.Trim();
            owner.MiddleName = request.MiddleName == null ? owner.MiddleName : (string.IsNullOrWhiteSpace(request.MiddleName) ? null : request.MiddleName.Trim());
            if (request.BankName != null) owner.BankName = request.BankName.Trim();

            await _ownerRepo.UpdateAsync(owner);
            return Ok(new { message = "Владелец обновлён" });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteOwner(int id)
        {
            var uid = CurrentUserId();
            if (uid is null) return Unauthorized();

            var ok = await _ownerRepo.DeleteAsync(id, uid.Value);
            if (!ok) return NotFound();
            return Ok(new { message = "Владелец удалён" });
        }

        // ---------- REQUISITES ----------

        [HttpGet("{ownerId:int}/requisites")]
        public async Task<IActionResult> GetRequisites(int ownerId)
        {
            var uid = CurrentUserId();
            if (uid is null) return Unauthorized();

            var owner = await _ownerRepo.GetByIdAsync(ownerId, uid.Value);
            if (owner == null) return NotFound();

            var list = await _reqRepo.GetForOwnerAsync(ownerId);
            var dto = list.Select(r => new RequisiteDto
            {
                Id = r.Id,
                Type = r.Type.ToString().ToLower(),
                Value = r.Value
            });
            return Ok(dto);
        }

        [HttpPost("{ownerId:int}/requisites")]
        public async Task<IActionResult> AddRequisite(int ownerId, [FromBody] AddRequisiteRequest request)
        {
            var uid = CurrentUserId();
            if (uid is null) return Unauthorized();

            var owner = await _ownerRepo.GetByIdAsync(ownerId, uid.Value);
            if (owner == null) return NotFound();

            if (!TryParseType(request.Type, out var type))
                return BadRequest(new { message = "type должен быть 'card' | 'phone' | 'email'." });

            if (!ValidateValue(type, request.Value, out var err))
                return BadRequest(new { message = err });

            var req = new OwnerRequisite
            {
                OwnerId = ownerId,
                Type = type,
                Value = request.Value.Trim()
            };

            await _reqRepo.AddAsync(req);
            return Ok(new { id = req.Id });
        }

        [HttpPut("{ownerId:int}/requisites/{reqId:int}")]
        public async Task<IActionResult> UpdateRequisite(int ownerId, int reqId, [FromBody] UpdateRequisiteRequest request)
        {
            var uid = CurrentUserId();
            if (uid is null) return Unauthorized();

            var owner = await _ownerRepo.GetByIdAsync(ownerId, uid.Value);
            if (owner == null) return NotFound();

            var req = await _reqRepo.GetByIdAsync(reqId);
            if (req == null || req.OwnerId != ownerId) return NotFound();

            // обновляем
            if (request.Type != null)
            {
                if (!TryParseType(request.Type, out var t))
                    return BadRequest(new { message = "type должен быть 'card' | 'phone' | 'email'." });
                req.Type = t;
            }

            if (request.Value != null)
            {
                var valueToSet = request.Value.Trim();
                if (!ValidateValue(req.Type, valueToSet, out var err))
                    return BadRequest(new { message = err });
                req.Value = valueToSet;
            }

            await _reqRepo.UpdateAsync(req);
            return Ok(new { message = "Реквизит обновлён" });
        }

        [HttpDelete("{ownerId:int}/requisites/{reqId:int}")]
        public async Task<IActionResult> DeleteRequisite(int ownerId, int reqId)
        {
            var uid = CurrentUserId();
            if (uid is null) return Unauthorized();

            var owner = await _ownerRepo.GetByIdAsync(ownerId, uid.Value);
            if (owner == null) return NotFound();

            var req = await _reqRepo.GetByIdAsync(reqId);
            if (req == null || req.OwnerId != ownerId) return NotFound();

            var ok = await _reqRepo.DeleteAsync(reqId);
            if (!ok) return NotFound();

            return Ok(new { message = "Реквизит удалён" });
        }

        // ==== helpers ====
        private static bool TryParseType(string raw, out RequisiteType type)
        {
            type = RequisiteType.Card;
            if (string.IsNullOrWhiteSpace(raw)) return false;
            switch (raw.Trim().ToLowerInvariant())
            {
                case "card": type = RequisiteType.Card; return true;
                case "phone": type = RequisiteType.Phone; return true;
                case "email": type = RequisiteType.Email; return true;
                default: return false;
            }
        }

        private static bool ValidateValue(RequisiteType type, string value, out string? error)
        {
            error = null;
            if (string.IsNullOrWhiteSpace(value))
            {
                error = "Value обязателен.";
                return false;
            }

            var v = value.Trim();

            switch (type)
            {
                case RequisiteType.Card:
                    // допускаем 16-19 цифр, можно с пробелами/дефисами
                    var digits = Regex.Replace(v, @"[\s-]", "");
                    if (!Regex.IsMatch(digits, @"^\d{12,19}$"))
                    {
                        error = "Неверный формат номера карты";
                        return false;
                    }
                    return true;

                case RequisiteType.Phone:
                    if (!Regex.IsMatch(v, @"^\+?\d{8,15}$"))
                    {
                        error = "Неверный формат телефона";
                        return false;
                    }
                    return true;

                case RequisiteType.Email:
                    if (!Regex.IsMatch(v, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                    {
                        error = "Неверный формат email";
                        return false;
                    }
                    return true;

                default:
                    error = "Неизвестный тип реквизита";
                    return false;
            }
        }
    }
}
