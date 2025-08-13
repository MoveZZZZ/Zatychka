namespace Zatychka.Server.DTOs.Links
{
    public class LinkListItemDtoTRANS
    {
        public int Id { get; set; }
        public string UserLogin { get; set; } = "";
        public string DeviceName { get; set; } = "";
        public string RequisiteDisplay { get; set; } = "";
        public bool IsActive { get; set; }
        public decimal MinAmountUsdt { get; set; }
        public decimal MaxAmountUsdt { get; set; }
        public int? DailyTxCountLimit { get; set; }
        public int? MonthlyTxCountLimit { get; set; }
        public int? TotalTxCountLimit { get; set; }
        public int? MaxConcurrentTransactions { get; set; }
        public int? MinMinutesBetweenTransactions { get; set; }
    }
}
