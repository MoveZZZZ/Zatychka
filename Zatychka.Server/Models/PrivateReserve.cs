namespace Zatychka.Server.Models
{
    public class PrivateReserve
    {
        public long Id { get; set; }
        public string UserId { get; set; } = default!;  
        public decimal Amount { get; set; }             
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
