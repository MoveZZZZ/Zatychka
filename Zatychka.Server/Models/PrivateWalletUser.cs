namespace Zatychka.Server.Models
{
    public class PrivateWalletUser
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public decimal MainUsdt { get; set; }
        public decimal FrozenUsdt { get; set; }
        public decimal InsuranceUsdt { get; set; }
        public User User { get; set; } 
    }
}
