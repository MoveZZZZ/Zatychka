namespace Zatychka.Server.Models
{
    public class PublicWalletUser
    {
        public int Id { get; set; } = 1;
        public decimal MainUsdt { get; set; }
        public decimal FrozenUsdt { get; set; }
        public decimal InsuranceUsdt { get; set; }
    }
}
