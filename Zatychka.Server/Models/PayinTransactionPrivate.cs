using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Zatychka.Server.Models
{
    public class PayinTransactionPrivate
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public int UserId { get; set; }     // владелец записи
        public User User { get; set; }

        public DateTime Date { get; set; } = DateTime.UtcNow;
        public PayinStatus Status { get; set; } = PayinStatus.Created;

        public int? RequisiteId { get; set; }
        public OwnerRequisite Requisite { get; set; }

        public int? DeviceId { get; set; }
        public Device Device { get; set; }

        public decimal DealAmount { get; set; }
        public decimal IncomeAmount { get; set; }
    }
}
