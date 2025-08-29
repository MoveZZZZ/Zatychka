
namespace Zatychka.Server.Models
{
   
    public class PublicReserve
    {
        public int Id { get; set; }           
        public decimal Amount { get; set; }    
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
