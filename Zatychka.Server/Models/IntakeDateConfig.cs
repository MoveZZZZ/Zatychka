using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Zatychka.Server.Models
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum IntakeDateMode
    {
        Actual = 0, 
        Custom = 1  
    }

    public class IntakeDateConfig
    {
        [Key]
        public int Id { get; set; } = 1; 

        public IntakeDateMode Mode { get; set; } = IntakeDateMode.Actual;

        public DateTime? CustomDate { get; set; }

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
