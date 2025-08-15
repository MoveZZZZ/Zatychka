using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Zatychka.Server.Models
{
    public class PrivateDispute
    {
        public int Id { get; set; }

        // Владелец приватного спора
        [Required]
        public int UserId { get; set; }
        public User? User { get; set; }

        public int? TransactionId { get; set; }

        [Required]
        public DisputeStatus Status { get; set; }

        public int? RequisiteId { get; set; }
        public OwnerRequisite? Requisite { get; set; }

        public int? DeviceId { get; set; }
        public Device? Device { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal DealAmount { get; set; }

        // Произвольные ссылки/имена файлов — JSON-массив строк
        public string? FilesJson { get; set; }

        // Если InProgress — конечный момент таймера (UTC).
        public DateTime? TimerEndUtc { get; set; }

        // Если Frozen — «замороженный остаток» в секундах.
        public int? PausedRemainingSeconds { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
