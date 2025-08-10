using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Zatychka.Server.Models
{
    public enum BalanceChangeType
    {
        Deposit = 0,           // Пополнение
        Withdrawal = 1,        // Вывод
        Transaction = 2,       // Транзакция
        TraderReward = 3,      // Награда трейдеру
        MerchantEarning = 4,   // Заработок мерчанта
        Dispute = 5            // Спор
    }

    // Обычная история (баланс до/после)
    public class BalanceChange
    {
        public int Id { get; set; }

        // null => public, иначе private для конкретного пользователя
        public int? UserId { get; set; }
        public User? User { get; set; }

        public DateTime Date { get; set; } = DateTime.UtcNow;

        [Required]
        public BalanceChangeType Type { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal BalanceBefore { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal BalanceAfter { get; set; }
    }

    // Замороженная история (дата заморозки/разморозки)
    public class FrozenBalanceChange
    {
        public int Id { get; set; }

        public int? UserId { get; set; }
        public User? User { get; set; }

        public DateTime FreezeDate { get; set; } = DateTime.UtcNow;
        public DateTime? UnfreezeDate { get; set; }

        [Required]
        public BalanceChangeType Type { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }
    }
}
