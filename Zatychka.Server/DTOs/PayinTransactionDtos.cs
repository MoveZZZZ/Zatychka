using System;
using System.ComponentModel.DataAnnotations;

namespace Zatychka.Server.DTOs
{
    public class PayinTransactionUpsertDto
    {
        [Required] public DateTime Date { get; set; }
        [Required] public string Status { get; set; } = null!;
        public int? RequisiteId { get; set; }
        public int? DeviceId { get; set; }
        [Range(0, double.MaxValue)] public decimal DealAmount { get; set; }
        [Range(0, double.MaxValue)] public decimal IncomeAmount { get; set; }
    }

    public class PayinTransactionDto
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public string Status { get; set; }

        public int? RequisiteId { get; set; }
        public string RequisiteDisplay { get; set; }   // отформатированная строка
        public string OwnerEmail { get; set; }         // владелец реквизита

        public int? DeviceId { get; set; }
        public string DeviceName { get; set; }

        public decimal DealAmount { get; set; }
        public decimal IncomeAmount { get; set; }
    }
}
