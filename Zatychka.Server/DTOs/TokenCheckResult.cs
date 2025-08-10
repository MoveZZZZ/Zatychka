using Zatychka.Server.Models;
using Zatychka.Server.Services;

namespace Zatychka.Server.DTOs
{
    public class TokenCheckResult
    {
        public bool IsValid { get; init; }
        public string? Error { get; init; }
        public User? User { get; init; }
        public TokenPair? NewTokens { get; init; }
    }
}
