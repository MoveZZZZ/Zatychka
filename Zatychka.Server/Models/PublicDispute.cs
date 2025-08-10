using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Zatychka.Server.Models
{
    public enum DisputeStatus
    {
        InProgress = 0, // В процессе
        Completed = 1, // Завершено
        Cancelled = 2, // Отменено (только админ)
        Frozen = 3, // Заморожено
    }

    public class PublicDispute
    {
        public int Id { get; set; }

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

        // Если Frozen — «замороженный остаток» в секундах (показываем как есть).
        public int? PausedRemainingSeconds { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
