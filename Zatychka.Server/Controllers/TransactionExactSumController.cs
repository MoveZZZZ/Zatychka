using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Zatychka.Server.DTOs;
using Zatychka.Server.Services;

namespace Zatychka.Server.Controllers
{
    [Route("api/payin/generate/exact-sum")]
    [ApiController]
    public class TransactionExactSumController : ControllerBase
    {
        private readonly TransactionGenerationService _svc;
        public TransactionExactSumController(TransactionGenerationService svc) => _svc = svc;


        [HttpPost("public")]
        [Authorize(Policy = "AdminOnly")] 
        public async Task<IActionResult> GeneratePublic([FromBody] GenerateExactSumRequestDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var res = await _svc.GenerateExactSumAsync(
                    dayUtc: dto.Date,
                    count: dto.Count,
                    min: dto.MinAmount,
                    max: dto.MaxAmount,
                    total: dto.TotalAmount,
                    isPrivate: false,
                    ct: ct);

                return Ok(new { created = res.Created });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }


        [HttpPost("private")]
        [Authorize(Policy = "AdminOnly")] 
        public async Task<IActionResult> GeneratePrivate([FromBody] GenerateExactSumRequestDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var res = await _svc.GenerateExactSumAsync(
                    dayUtc: dto.Date,
                    count: dto.Count,
                    min: dto.MinAmount,
                    max: dto.MaxAmount,
                    total: dto.TotalAmount,
                    isPrivate: true,
                    ct: ct);

                return Ok(new { created = res.Created });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}
