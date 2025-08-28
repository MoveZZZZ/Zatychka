using System.Security.Claims;
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

        // ─────────────────────────────────────────────────────────────────────────
        // Helpers: достать userId и email из клеймов разных провайдеров
        // ─────────────────────────────────────────────────────────────────────────
        private bool TryGetUserId(out int userId)
        {
            userId = default;

            var id = User.FindFirst("userID")?.Value
                     ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrWhiteSpace(id))
                return false;

            return int.TryParse(id, out userId);
        }


        private string? GetActorEmail()
        {
            return
                User.FindFirstValue(ClaimTypes.Email)
                ?? User.FindFirstValue("email")
                ?? User.FindFirstValue("preferred_username"); // иногда тут бывает e-mail/логин
        }

        // ─────────────────────────────────────────────────────────────────────────

        [HttpPost("public")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> GeneratePublic([FromBody] GenerateExactSumRequestDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            if (!TryGetUserId(out var userId))
                return BadRequest(new { error = "Не удалось определить пользователя из токена." });

            var actorEmail = GetActorEmail();

            try
            {
                var res = await _svc.GenerateExactSumAsync(
                    dayUtc: dto.Date,
                    count: dto.Count,
                    min: dto.MinAmount,
                    max: dto.MaxAmount,
                    total: dto.TotalAmount,
                    isPrivate: false,           // публичные
                    onlyForUserId: userId,      // ← генерим ТОЛЬКО под связки вызывающего пользователя
                    actorEmail: actorEmail,     // (в паблике не влияет на %, но передадим для единообразия)
                    ct: ct
                );

                return Ok(new { created = res.Created });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("private")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> GeneratePrivate([FromBody] GenerateExactSumRequestDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            if (!TryGetUserId(out var userId))
                return BadRequest(new { error = "Не удалось определить пользователя из токена." });

            var actorEmail = GetActorEmail();

            try
            {
                var res = await _svc.GenerateExactSumAsync(
                    dayUtc: dto.Date,
                    count: dto.Count,
                    min: dto.MinAmount,
                    max: dto.MaxAmount,
                    total: dto.TotalAmount,
                    isPrivate: true,            // приватные
                    onlyForUserId: userId,      // ← генерим ТОЛЬКО под связки вызывающего пользователя
                    actorEmail: actorEmail,     // ← правило %: morphio.qwe2@gmail.com → +12.5%, иначе +6.5%
                    ct: ct
                );

                return Ok(new { created = res.Created });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}
