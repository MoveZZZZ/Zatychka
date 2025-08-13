using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Zatychka.Server.Models
{
    public class PayinTransactionPublic
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)] // для MySQL -> AUTO_INCREMENT
        public int Id { get; set; }

        [Required]
        public DateTime Date { get; set; }

        [Required, MaxLength(64)]
        public string Status { get; set; } = null!; // "Создана", "В процессе", "Выполнена", "Заморожена"

        public int? RequisiteId { get; set; }
        public OwnerRequisite? Requisite { get; set; }

        public int? DeviceId { get; set; }
        public Device? Device { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal DealAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal IncomeAmount { get; set; }
        public int? LinkId { get; set; }
        public Link? Link { get; set; }
    }
}
