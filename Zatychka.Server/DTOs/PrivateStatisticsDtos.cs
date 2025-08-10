namespace Zatychka.Server.DTOs
{
    public class IntakeDto
    {
        public int TotalTxCount { get; set; }
        public decimal TotalTxAmountUSDT { get; set; }
        public int ActiveTxCount { get; set; }
        public decimal ActiveTxAmountUSDT { get; set; }
        public int SuccessRateValue { get; set; }
        public string? SuccessRateSuffix { get; set; }
        public decimal ProfitUSDT { get; set; }
    }

    public class DisputesDto
    {
        public int TotalCount { get; set; }
        public int ActiveCount { get; set; }
    }

    public class StatisticsNumbersDto
    {
        public IntakeDto Intake { get; set; } = new();
        public DisputesDto Disputes { get; set; } = new();
    }

    // PATCH-версия (всё опционально)
    public class IntakePatchDto
    {
        public int? TotalTxCount { get; set; }
        public decimal? TotalTxAmountUSDT { get; set; }
        public int? ActiveTxCount { get; set; }
        public decimal? ActiveTxAmountUSDT { get; set; }
        public int? SuccessRateValue { get; set; }
        public string? SuccessRateSuffix { get; set; }
        public decimal? ProfitUSDT { get; set; }
    }

    public class DisputesPatchDto
    {
        public int? TotalCount { get; set; }
        public int? ActiveCount { get; set; }
    }

    public class StatisticsNumbersPatchDto
    {
        public IntakePatchDto? Intake { get; set; }
        public DisputesPatchDto? Disputes { get; set; }
    }
}
