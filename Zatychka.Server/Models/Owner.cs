using System.ComponentModel.DataAnnotations;

namespace Zatychka.Server.Models
{
    public class Owner
    {
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string FirstName { get; set; } = null!;

        [Required, MaxLength(100)]
        public string LastName { get; set; } = null!;

        [MaxLength(100)]
        public string? MiddleName { get; set; }

        [Required, MaxLength(150)]
        public string BankName { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // связь с юзером
        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public ICollection<OwnerRequisite> Requisites { get; set; } = new List<OwnerRequisite>();
    }
}
