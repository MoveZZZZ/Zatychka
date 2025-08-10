namespace Zatychka.Server.DTOs
{
    public class WalletPatchDto
    {
        public decimal? MainUsdt { get; set; }
        public decimal? FrozenUsdt { get; set; }
        public decimal? InsuranceUsdt { get; set; }
    }
}
