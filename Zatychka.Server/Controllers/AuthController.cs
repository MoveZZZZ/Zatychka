using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Zatychka.Server.Services;
using Zatychka.Server.DTOs;
using System.Security.Claims;
using Zatychka.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.BearerToken;
using System.Data;
using Zatychka.Server.Repositories;

namespace Zatychka.Server.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly JwtService _jwtService;
        private readonly IRefreshTokenRepository _refreshRepo;

        public AuthController(IUserService userService, JwtService jwtService, IRefreshTokenRepository refreshRepo)
        {
            _userService = userService;
            _jwtService = jwtService;
            _refreshRepo = refreshRepo;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                await _userService.RegisterAsync(request);
                return Ok(new { message = "Пользователь создан" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var (user, tokens) = await _userService.LoginAsync(request);

                await _refreshRepo.InvalidateAllForUserAsync(user.Id);

                var refreshExpiresAt = DateTime.UtcNow.AddDays(10);

                var tokenToStore = tokens.RefreshToken;

                await _refreshRepo.AddAsync(new RefreshToken
                {
                    Token = tokenToStore,
                    UserId = user.Id,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = refreshExpiresAt
                });
                AppendAuthCookies(tokens);

                return Ok(new
                {
                    message = "Успешный вход",
                    user = new { id = user.Id, email = user.Email, role = user.Role } 
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        [HttpPost("refresh_access_token")]
        public IActionResult RefreshAccessToken() => Refresh();

        [HttpPost("check")]
        public IActionResult Refresh()
        {
            var accessToken = Request.Cookies["access_token"];
            var refreshToken = Request.Cookies["refresh_token"];

            var result = _jwtService.ValidateAndRefreshTokenPair(new TokenPair
            {
                AccessToken = accessToken ?? string.Empty,
                RefreshToken = refreshToken ?? string.Empty
            });

            if (!result.IsValid)
                return Unauthorized(new { message = result.Error });


            AppendAuthCookies(result.NewTokens!);

            return Ok(new
            {
                message = "Токены обновлены",
                user = new { id = result.User!.Id, email = result.User.Email, role = result.User.Role }
            });
            //var accessToken = Request.Cookies["access_token"];
            //var refreshToken = Request.Cookies["refresh_token"];

            //var principal = _jwtService.GetPrincipalFromExpiredToken(refreshToken);
            //if (principal == null)
            //    return Unauthorized(new { message = "Невалидный refresh token" });

            //var userIdClaim = principal.Claims.FirstOrDefault(c => c.Type == "userID")?.Value;
            //var roleClaim = principal.FindFirst(ClaimTypes.Role)?.Value;
            //var emailClaim = principal.FindFirst(ClaimTypes.Email)?.Value;

            //if (string.IsNullOrEmpty(userIdClaim) || string.IsNullOrEmpty(roleClaim))
            //    return Unauthorized(new { message = "Некорректные данные в токене" });

            //var user = new User
            //{
            //    Id = int.Parse(userIdClaim),
            //    Email = emailClaim ?? "",
            //    Role = roleClaim
            //};

            //var tokens = _jwtService.GenerateTokenPair(user);

            //AppendAuthCookies(tokens);

            //return Ok(new { message = "Токены обновлены" });
        }
        [HttpGet("user_info")]
        [Authorize]
        public IActionResult GetUserInfo()
        {
            var idStr = User.FindFirst("userID")?.Value
                     ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value; // на всякий

            var email = User.FindFirst(ClaimTypes.Email)?.Value
                     ?? User.FindFirst("email")?.Value;

            var role = User.FindFirst(ClaimTypes.Role)?.Value
                     ?? User.FindFirst("role")?.Value;

            if (string.IsNullOrWhiteSpace(idStr) || string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(role))
                return Unauthorized("Клеймы не найдены");

            if (!int.TryParse(idStr, out var id))
                return Unauthorized("Некорректный userID");

            return Ok(new { id, email, role });
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            if (Request.Cookies.TryGetValue("refresh_token", out var refreshToken) &&
                !string.IsNullOrEmpty(refreshToken))
            {
                await _refreshRepo.InvalidateAsync(refreshToken);
            }

            Response.Cookies.Delete("access_token", new CookieOptions { Path = "/" });
            Response.Cookies.Delete("refresh_token", new CookieOptions { Path = "/" });

            return Ok(new { message = "Вы вышли из системы" });
        }


        private void AppendAuthCookies(TokenPair tokens)
        {
            var accessCookie = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Lax,
                Path = "/",
                Expires = DateTime.UtcNow.AddSeconds(600)
            };

            var refreshCookie = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Lax,
                Path = "/",
                Expires = DateTime.UtcNow.AddDays(10)
            };

            Response.Cookies.Append("access_token", tokens.AccessToken, accessCookie);
            Response.Cookies.Append("refresh_token", tokens.RefreshToken, refreshCookie);
        }
    }
}
