// DTOs/WalletDtos.cs
namespace Zatychka.Server.DTOs
{
    public class WalletResponse
    {
        public decimal MainUsdt { get; set; }
        public decimal FrozenUsdt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class WalletUpdateRequest
    {
        public decimal? MainUsdt { get; set; }
        public decimal? FrozenUsdt { get; set; }
    }
}
