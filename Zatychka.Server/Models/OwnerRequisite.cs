using System.ComponentModel.DataAnnotations;

namespace Zatychka.Server.Models
{
    public enum RequisiteType
    {
        Card = 0,
        Phone = 1,
        Email = 2
    }

    public class OwnerRequisite
    {
        public int Id { get; set; }

        public int OwnerId { get; set; }
        public Owner Owner { get; set; } = null!;

        [Required]
        public RequisiteType Type { get; set; }

        [Required, MaxLength(256)]
        public string Value { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
