using System.ComponentModel.DataAnnotations;

namespace Zatychka.Server.Models
{
    public class DepositCursor
    {
        public int Id { get; set; }

        [Required]
        public string Address { get; set; } = default!; 

        public string? LastTxId { get; set; }
        public long? LastBlockTimestamp { get; set; } 
    }
}
