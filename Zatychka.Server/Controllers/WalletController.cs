// Controllers/WalletController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Zatychka.Server.DTOs;
using Zatychka.Server.Repositories;

namespace Zatychka.Server.Controllers
{
    [ApiController]
    [Route("api/wallet")]
    public class WalletController : ControllerBase
    {
        private readonly IUserWalletRepository _repo;
        public WalletController(IUserWalletRepository repo) => _repo = repo;

        private int? CurrentUserId()
        {
            var id = User.FindFirst("userID")?.Value;
            if (int.TryParse(id, out var uid)) return uid;
            return null;
        }


        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetMy()
        {
            var uid = CurrentUserId();
            if (uid == null) return Unauthorized();

            var w = await _repo.GetOrCreateAsync(uid.Value);
            return Ok(new WalletResponse
            {
                MainUsdt = w.MainUsdt,
                FrozenUsdt = w.FrozenUsdt,
                UpdatedAt = w.UpdatedAt
            });
        }

        [Authorize(Policy = "AdminOnly")]
        [HttpPut]
        public async Task<IActionResult> UpdateMy([FromBody] WalletUpdateRequest req)
        {
            var uid = CurrentUserId();
            if (uid == null) return Unauthorized();

            var w = await _repo.UpdateAsync(uid.Value, req.MainUsdt, req.FrozenUsdt);
            return Ok(new WalletResponse
            {
                MainUsdt = w.MainUsdt,
                FrozenUsdt = w.FrozenUsdt,
                UpdatedAt = w.UpdatedAt
            });
        }


        [Authorize(Policy = "AdminOnly")]
        [HttpPut("{userId:int}")]
        public async Task<IActionResult> UpdateForUser(int userId, [FromBody] WalletUpdateRequest req)
        {
            var w = await _repo.UpdateAsync(userId, req.MainUsdt, req.FrozenUsdt);
            return Ok(new WalletResponse
            {
                MainUsdt = w.MainUsdt,
                FrozenUsdt = w.FrozenUsdt,
                UpdatedAt = w.UpdatedAt
            });
        }
    }
}
