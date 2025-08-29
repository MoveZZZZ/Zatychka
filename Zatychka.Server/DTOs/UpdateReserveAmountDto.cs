using System.ComponentModel.DataAnnotations;

namespace Zatychka.Server.DTOs
{
    public class UpdateReserveAmountDto
    {
        [Required, Range(0, 1_000_000_000)]
        public decimal Amount { get; set; }
    }
}
