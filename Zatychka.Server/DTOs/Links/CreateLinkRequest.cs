namespace Zatychka.Server.DTOs.Links
{
    public class CreateLinkRequest
    {
        public int DeviceId { get; set; }
        public int RequisiteId { get; set; }

        public decimal MinAmountUsdt { get; set; }
        public decimal MaxAmountUsdt { get; set; }

        public int? DailyTxCountLimit { get; set; }
        public int? MonthlyTxCountLimit { get; set; }
        public int? TotalTxCountLimit { get; set; }

        public decimal? DailyAmountLimitUsdt { get; set; }
        public decimal? MonthlyAmountLimitUsdt { get; set; }
        public decimal? TotalAmountLimitUsdt { get; set; }

        public int? MaxConcurrentTransactions { get; set; }
        public int? MinMinutesBetweenTransactions { get; set; }
        public bool? IsActive { get; set; }
    }
}
