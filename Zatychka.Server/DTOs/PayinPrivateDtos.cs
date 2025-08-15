// DTOs/PayinPrivateDtos.cs
using System.ComponentModel.DataAnnotations;
using Zatychka.Server.Models;

namespace Zatychka.Server.DTOs
{
    public class PayinTransactionPrivateUpsertDto
    {
        [Required] public int UserId { get; set; }          // владелец записи
        [Required] public DateTime Date { get; set; }
        public string Status { get; init; } = "";

        public int? RequisiteId { get; set; }
        public int? DeviceId { get; set; }

        [Required] public decimal DealAmount { get; set; }
        [Required] public decimal IncomeAmount { get; set; }
    }
}
