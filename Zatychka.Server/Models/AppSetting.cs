using System.ComponentModel.DataAnnotations;

namespace Zatychka.Server.Models
{
    public class AppSetting
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string Key { get; set; } = null!;  // например: "statistics_texts"

        [Required]
        public string Json { get; set; } = "{}";  // храним JSON как строку

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public int? UpdatedByUserId { get; set; }
    }
}
