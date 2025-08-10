using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Zatychka.Server.Data;
using Zatychka.Server.DTOs;
using Zatychka.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Zatychka.Server.Controllers
{
    [Route("api/privatewalletuser")]
    [ApiController]
    public class PrivateWalletControllerUser : ControllerBase
    {
        private readonly AppDbContext _db;
        public PrivateWalletControllerUser(AppDbContext db) => _db = db;

        private int? CurrentUserId()
        {
            var raw = User.FindFirst("userID")?.Value
                      ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                      ?? User.FindFirst("nameid")?.Value
                      ?? User.FindFirst("sub")?.Value;

            return int.TryParse(raw, out var id) && id > 0 ? id : (int?)null;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetMine()
        {
            var uid = CurrentUserId();
            if (uid == null) return Unauthorized();

            var w = await _db.PrivateWalletUser.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == uid.Value);
            if (w == null)
            {
                w = new PrivateWalletUser { UserId = uid.Value, MainUsdt = 0, FrozenUsdt = 0, InsuranceUsdt = 0 };
                _db.PrivateWalletUser.Add(w);
                await _db.SaveChangesAsync();
            }

            return Ok(new
            {
                mainUsdt = w.MainUsdt,
                frozenUsdt = w.FrozenUsdt,
                insuranceUsdt = w.InsuranceUsdt
            });
        }

        [HttpPut]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> PatchMine([FromBody] WalletPatchDto dto)
        {
            var uid = CurrentUserId();
            if (uid == null) return Unauthorized();

            var w = await _db.PrivateWalletUser.FirstOrDefaultAsync(x => x.UserId == uid.Value);
            if (w == null)
            {
                w = new PrivateWalletUser { UserId = uid.Value };
                _db.PrivateWalletUser.Add(w);
            }

            if (dto.MainUsdt.HasValue) w.MainUsdt = dto.MainUsdt.Value;
            if (dto.FrozenUsdt.HasValue) w.FrozenUsdt = dto.FrozenUsdt.Value;
            if (dto.InsuranceUsdt.HasValue) w.InsuranceUsdt = dto.InsuranceUsdt.Value;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                mainUsdt = w.MainUsdt,
                frozenUsdt = w.FrozenUsdt,
                insuranceUsdt = w.InsuranceUsdt
            });
        }
    }
}
