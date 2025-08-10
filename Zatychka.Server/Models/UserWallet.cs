// Models/UserWallet.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Zatychka.Server.Models
{
    public class UserWallet
    {
        [Key] public int Id { get; set; }

        [Required] public int UserId { get; set; }
        public User User { get; set; } = null!;

        // Все суммы в USDT
        [Column(TypeName = "decimal(18,2)")]
        public decimal MainUsdt { get; set; } = 0m;

        [Column(TypeName = "decimal(18,2)")]
        public decimal FrozenUsdt { get; set; } = 0m;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
