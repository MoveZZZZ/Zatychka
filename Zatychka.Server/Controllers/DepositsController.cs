// Controllers/DepositsController.cs
using Microsoft.AspNetCore.Mvc;
using Zatychka.Server.Services;

namespace Zatychka.Server.Controllers
{
    public sealed class CheckDepositsRequest
    {
        public string Address { get; set; } = default!; 
        public int? UserId { get; set; }                
    }

    [ApiController]
    [Route("api/deposits")]
    public class DepositsController : ControllerBase
    {
        private readonly ITronDepositService _svc;

        public DepositsController(ITronDepositService svc) => _svc = svc;

        [HttpPost("check")]
        public async Task<IActionResult> Check([FromBody] CheckDepositsRequest req, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(req.Address))
                return BadRequest("Address is required");

            var res = await _svc.CheckAndSaveAsync(req.Address, req.UserId, ct);
            return Ok(new
            {
                count = res.Count,
                items = res.Select(x => new { x.TxId, x.Amount, x.Utc, x.From })
            });
        }
    }
}
