using System.ComponentModel.DataAnnotations;

namespace Zatychka.Server.Models
{
    public class PrivateStatisticsUser
    {
        public int Id { get; set; }

        // тот же тип, что и в Users.Id (у вас int)
        public int UserId { get; set; }

        // intake
        public int TotalTxCount { get; set; }
        public decimal TotalTxAmountUSDT { get; set; }
        public int ActiveTxCount { get; set; }
        public decimal ActiveTxAmountUSDT { get; set; }
        public int SuccessRateValue { get; set; }
        [MaxLength(8)]
        public string? SuccessRateSuffix { get; set; }
        public decimal ProfitUSDT { get; set; }

        // disputes
        public int DisputesTotalCount { get; set; }
        public int DisputesActiveCount { get; set; }

        public User User { get; set; } = null!;
    }
}
