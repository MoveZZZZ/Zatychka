using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Zatychka.Server.Data;
using Zatychka.Server.DTOs;
using Zatychka.Server.Models;

namespace Zatychka.Server.Controllers
{
    [Route("api/privatestatisticsuser")]
    [ApiController]
    public class PrivateStatisticsControllerUser : ControllerBase
    {
        private readonly AppDbContext _db;
        public PrivateStatisticsControllerUser(AppDbContext db) => _db = db;

        int? CurrentUserId()
        {
            var id = User.FindFirst("userID")?.Value
                     ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(id, out var uid) ? uid : (int?)null;
        }

        static StatisticsNumbersDto ToDto(PrivateStatisticsUser s) => new StatisticsNumbersDto
        {
            Intake = new IntakeDto
            {
                TotalTxCount = s.TotalTxCount,
                TotalTxAmountUSDT = s.TotalTxAmountUSDT,
                ActiveTxCount = s.ActiveTxCount,
                ActiveTxAmountUSDT = s.ActiveTxAmountUSDT,
                SuccessRateValue = s.SuccessRateValue,
                SuccessRateSuffix = s.SuccessRateSuffix,
                ProfitUSDT = s.ProfitUSDT
            },
            Disputes = new DisputesDto
            {
                TotalCount = s.DisputesTotalCount,
                ActiveCount = s.DisputesActiveCount
            }
        };

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetMine()
        {
            var uid = CurrentUserId();
            if (uid == null) return Unauthorized();

            var s = await _db.PrivateStatisticsUsers.FirstOrDefaultAsync(x => x.UserId == uid.Value);
            if (s == null)
            {
                s = new PrivateStatisticsUser
                {
                    UserId = uid.Value,
                    SuccessRateValue = 100,
                    SuccessRateSuffix = "%"
                };
                _db.PrivateStatisticsUsers.Add(s);
                await _db.SaveChangesAsync();
            }

            return Ok(ToDto(s));
        }

        [HttpPut]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> PatchMine([FromBody] StatisticsNumbersPatchDto dto)
        {
            var uid = CurrentUserId();
            if (uid == null) return Unauthorized();

            var s = await _db.PrivateStatisticsUsers.FirstOrDefaultAsync(x => x.UserId == uid.Value);
            if (s == null)
            {
                s = new PrivateStatisticsUser { UserId = uid.Value, SuccessRateValue = 100, SuccessRateSuffix = "%" };
                _db.PrivateStatisticsUsers.Add(s);
            }

            if (dto.Intake != null)
            {
                if (dto.Intake.TotalTxCount.HasValue) s.TotalTxCount = dto.Intake.TotalTxCount.Value;
                if (dto.Intake.TotalTxAmountUSDT.HasValue) s.TotalTxAmountUSDT = dto.Intake.TotalTxAmountUSDT.Value;
                if (dto.Intake.ActiveTxCount.HasValue) s.ActiveTxCount = dto.Intake.ActiveTxCount.Value;
                if (dto.Intake.ActiveTxAmountUSDT.HasValue) s.ActiveTxAmountUSDT = dto.Intake.ActiveTxAmountUSDT.Value;
                if (dto.Intake.SuccessRateValue.HasValue) s.SuccessRateValue = dto.Intake.SuccessRateValue.Value;
                if (dto.Intake.SuccessRateSuffix != null) s.SuccessRateSuffix = dto.Intake.SuccessRateSuffix;
                if (dto.Intake.ProfitUSDT.HasValue) s.ProfitUSDT = dto.Intake.ProfitUSDT.Value;
            }

            if (dto.Disputes != null)
            {
                if (dto.Disputes.TotalCount.HasValue) s.DisputesTotalCount = dto.Disputes.TotalCount.Value;
                if (dto.Disputes.ActiveCount.HasValue) s.DisputesActiveCount = dto.Disputes.ActiveCount.Value;
            }

            await _db.SaveChangesAsync();
            return Ok(ToDto(s));
        }
    }
}
