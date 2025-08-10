using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Zatychka.Server.Models
{
    public class Link
    {
        public int Id { get; set; }

        [Required] public int UserId { get; set; }
        public User User { get; set; } = null!;

        [Required] public int DeviceId { get; set; }
        public Device Device { get; set; } = null!;

        [Required] public int RequisiteId { get; set; }
        public OwnerRequisite Requisite { get; set; } = null!;

        [Column(TypeName = "decimal(18,2)")]
        public decimal MinAmountUsdt { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal MaxAmountUsdt { get; set; }

        public int? DailyTxCountLimit { get; set; }
        public int? MonthlyTxCountLimit { get; set; }
        public int? TotalTxCountLimit { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? DailyAmountLimitUsdt { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? MonthlyAmountLimitUsdt { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? TotalAmountLimitUsdt { get; set; }

        public int? MaxConcurrentTransactions { get; set; }
        public int? MinMinutesBetweenTransactions { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
