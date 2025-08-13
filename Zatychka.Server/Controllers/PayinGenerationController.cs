// Controllers/PayinGenerationController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Zatychka.Server.Services;

namespace Zatychka.Server.Controllers
{
    [Route("api/payin/generate")]
    [ApiController]
    public class PayinGenerationController : ControllerBase
    {
        private readonly TransactionGenerationService _svc;
        public PayinGenerationController(TransactionGenerationService svc) => _svc = svc;

        public class GenerateDto
        {
            public List<int> LinkIds { get; set; } = new();
            public int Count { get; set; } = 100;
        }

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Generate([FromBody] GenerateDto dto, CancellationToken ct)
        {
            if (dto.LinkIds == null || dto.LinkIds.Count == 0) return BadRequest("Выберите хотя бы одну связку");
            if (dto.Count <= 0) return BadRequest("Count должен быть > 0");

            var res = await _svc.GenerateAsync(new TransactionGenerationService.GenerateRequest
            {
                LinkIds = dto.LinkIds,
                Count = dto.Count
            }, ct);

            return Ok(res);
        }

        public class BackfillPairDto
        {
            public int DeviceId { get; set; }
            public int RequisiteId { get; set; }
            public decimal MinAmountUsdt { get; set; }
            public decimal MaxAmountUsdt { get; set; }
            public int DailyLimit { get; set; }
            public int MonthlyLimit { get; set; }
        }

        public class BackfillMonthDto
        {
            public int Year { get; set; }     // 2025
            public int Month { get; set; }    // 1..12
            public int? MaxTotalCount { get; set; }
            public List<BackfillPairDto> Pairs { get; set; } = new();
        }

        [HttpPost("backfill-month")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> BackfillMonth([FromBody] BackfillMonthDto dto, CancellationToken ct)
        {
            if (dto.Pairs == null || dto.Pairs.Count == 0) return BadRequest("Добавьте хотя бы одну пару устройство+реквизит");
            if (dto.Month < 1 || dto.Month > 12) return BadRequest("Некорректный месяц");
            if (dto.Year < 2000) return BadRequest("Некорректный год");

            // простая валидация пар
            foreach (var p in dto.Pairs)
            {
                if (p.DeviceId <= 0 || p.RequisiteId <= 0) return BadRequest("Некорректные DeviceId/RequisiteId");
                if (p.MinAmountUsdt < 0 || p.MaxAmountUsdt < 0 || p.MaxAmountUsdt < p.MinAmountUsdt)
                    return BadRequest("Некорректные суммы");
                if (p.DailyLimit < 0 || p.MonthlyLimit < 0) return BadRequest("Некорректные лимиты");
            }

            var req = new TransactionGenerationService.BackfillMonthRequest
            {
                Year = dto.Year,
                Month = dto.Month,
                MaxTotalCount = dto.MaxTotalCount,
                Pairs = dto.Pairs.Select(p => new TransactionGenerationService.BackfillMonthRequest.PairConfig
                {
                    DeviceId = p.DeviceId,
                    RequisiteId = p.RequisiteId,
                    MinAmountUsdt = p.MinAmountUsdt,
                    MaxAmountUsdt = p.MaxAmountUsdt,
                    DailyLimit = p.DailyLimit,
                    MonthlyLimit = p.MonthlyLimit
                }).ToList()
            };

            var res = await _svc.BackfillMonthAsync(req, ct);
            return Ok(res);
        }
    }
}

