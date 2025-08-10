using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Zatychka.Server.Data;
using Zatychka.Server.DTOs;
using Microsoft.EntityFrameworkCore;
using Zatychka.Server.Models;

namespace Zatychka.Server.Controllers
{
    [Route("api/publicwalletuser")]
    [ApiController]
    public class PublicWalletControllerUser : ControllerBase
    {
        private readonly AppDbContext _db;
        public PublicWalletControllerUser(AppDbContext db) => _db = db;

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> Get()
        {
            var w = await _db.PublicWalletUser.AsNoTracking().FirstOrDefaultAsync(x => x.Id == 1)
                    ?? new PublicWalletUser { Id = 1 };
            return Ok(new
            {
                mainUsdt = w.MainUsdt,
                frozenUsdt = w.FrozenUsdt,
                insuranceUsdt = w.InsuranceUsdt
            });
        }

        [HttpPut]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Put([FromBody] WalletPatchDto dto)
        {
            var w = await _db.PublicWalletUser.FirstOrDefaultAsync(x => x.Id == 1);
            if (w == null)
            {
                w = new PublicWalletUser { Id = 1 };
                _db.PublicWalletUser.Add(w);
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
