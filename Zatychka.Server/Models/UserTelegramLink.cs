using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Zatychka.Server.Models
{
    public class UserTelegramLink
    {
        public int Id { get; set; }

        [Required]
        [ForeignKey(nameof(User))]
        public int UserId { get; set; }
        public User User { get; set; } = null!;

        // username из ссылки t.me/<username> (без @), например "william_qwei"
        [Required, MaxLength(64)]
        public string Username { get; set; } = null!;

        // опционально — numeric telegram user id (если когда-нибудь подтянете от бота)
        public long? TelegramUserId { get; set; }

        [MaxLength(128)]
        public string? Source { get; set; } // например "admin" / "bot"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
