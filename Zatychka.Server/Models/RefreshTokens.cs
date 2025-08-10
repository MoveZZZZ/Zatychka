namespace Zatychka.Server.Models
{
    public class RefreshToken
    {
        public int Id { get; set; }

        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? RevokedAt { get; set; }

        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public bool IsActive => RevokedAt == null && DateTime.UtcNow < ExpiresAt;
    }
}
