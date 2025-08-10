using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Zatychka.Server.DTOs;
using Zatychka.Server.Services;

namespace Zatychka.Server.Controllers
{
    [Route("api/account")]
    [ApiController]
    [Authorize]
    public class AccountController : ControllerBase
    {
        private readonly IUserService _users;
        public AccountController(IUserService users) => _users = users;

        int? CurrentUserId()
        {
            var id = User.FindFirst("userID")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(id, out var uid) ? uid : (int?)null;
        }

        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var uid = CurrentUserId();
            if (uid == null) return Unauthorized();
            var dto = await _users.GetProfileAsync(uid.Value);
            return Ok(dto);
        }

        [HttpPut("me")]
        public async Task<IActionResult> Update([FromBody] UpdateUserRequest dto)
        {
            var uid = CurrentUserId();
            if (uid == null) return Unauthorized();
            var updated = await _users.UpdateProfileAsync(uid.Value, dto);
            return Ok(updated);
        }

        [HttpPut("password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest dto)
        {
            var uid = CurrentUserId();
            if (uid == null) return Unauthorized();
            await _users.ChangePasswordAsync(uid.Value, dto);
            return NoContent();
        }
    }
}
