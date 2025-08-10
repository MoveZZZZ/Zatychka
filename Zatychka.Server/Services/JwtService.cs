using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Zatychka.Server.DTOs;
using Zatychka.Server.Models;
using Zatychka.Server.Settings;

namespace Zatychka.Server.Services
{
    public class JwtService
    {
        private readonly TokenSettings _settings;

        public JwtService(TokenSettings settings)
        {
            _settings = settings;
        }

        public TokenPair GenerateTokenPair(User user)
        {
            return new TokenPair
            {
                AccessToken = CreateAccessToken(user),
                RefreshToken = CreateRefreshToken(user)
            };
        }

        public string CreateAccessToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim("userID", user.Id.ToString()),
                new Claim("email", user.Email),
                new Claim("role", user.Role)
            };

            var token = new JwtSecurityToken(
                issuer: _settings.Issuer,
                audience: _settings.Audience,
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: DateTime.UtcNow.AddSeconds(600),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public string CreateRefreshToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim("userID", user.Id.ToString()),
                new Claim("email", user.Email),
                new Claim("role", user.Role)
            };

            var token = new JwtSecurityToken(
                issuer: _settings.Issuer,
                audience: _settings.Audience,
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: DateTime.UtcNow.AddDays(10),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret));

            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = _settings.Issuer,
                    ValidateAudience = true,
                    ValidAudience = _settings.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = key,
                    ValidateLifetime = false 
                }, out _);

                return principal;
            }
            catch
            {
                return null;
            }
        }

        public bool ValidateToken(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret));
                tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = _settings.Issuer,
                    ValidateAudience = true,
                    ValidAudience = _settings.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = key,
                    ValidateLifetime = true
                }, out _);
                return true;
            }
            catch
            {
                return false;
            }
        }
        public TokenCheckResult ValidateAndRefreshTokenPair(TokenPair tokenPair)
        {

            if (string.IsNullOrEmpty(tokenPair.RefreshToken))
            {
                return new TokenCheckResult { IsValid = false, Error = "Refresh token отсутствует" };
            }


            var principal = GetPrincipalFromExpiredToken(tokenPair.RefreshToken);
            if (principal == null)
            {
                return new TokenCheckResult { IsValid = false, Error = "Невалидный refresh token" };
            }


            var userIdClaim = principal.Claims.FirstOrDefault(c => c.Type == "userID")?.Value;
            var roleClaim = principal.FindFirst(ClaimTypes.Role)?.Value;
            var emailClaim = principal.FindFirst(ClaimTypes.Email)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || string.IsNullOrEmpty(roleClaim))
            {
                return new TokenCheckResult { IsValid = false, Error = "Некорректные данные в токене" };
            }


            var user = new User
            {
                Id = int.Parse(userIdClaim),
                Email = emailClaim ?? string.Empty,
                Role = roleClaim
            };


            var newTokens = GenerateTokenPair(user);

            return new TokenCheckResult
            {
                IsValid = true,
                User = user,
                NewTokens = newTokens
            };
        }
        public TokenUserInfo? GetUserInfoFromAccessToken(string accessToken)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret));

            try
            {
                var principal = tokenHandler.ValidateToken(
                    accessToken,
                    new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidIssuer = _settings.Issuer,
                        ValidateAudience = true,
                        ValidAudience = _settings.Audience,
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = key,
                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.Zero
                    },
                    out _);

                var userIdClaim = principal.Claims.FirstOrDefault(c => c.Type == "userID")?.Value;
                var emailClaim = principal.Claims.FirstOrDefault(c => c.Type == "email")?.Value;
                var roleClaim = principal.Claims.FirstOrDefault(c => c.Type == "role")?.Value;

                if (string.IsNullOrWhiteSpace(userIdClaim) ||
                    string.IsNullOrWhiteSpace(emailClaim) ||
                    string.IsNullOrWhiteSpace(roleClaim))
                {
                    return null;
                }

                if (!int.TryParse(userIdClaim, out var userId))
                    return null;

                return new TokenUserInfo
                {
                    UserId = userId,
                    Email = emailClaim,
                    Role = roleClaim
                };
            }
            catch
            {
                return null;
            }
        }
    }

  

    public class TokenUserInfo
    {
        public int UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
    public class TokenPair
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
    }
}
