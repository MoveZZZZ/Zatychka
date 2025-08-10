// Models/PublicWallet.cs
public class PublicWallet
{
    public int Id { get; set; }                 
    public decimal MainUsdt { get; set; }
    public decimal FrozenUsdt { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
