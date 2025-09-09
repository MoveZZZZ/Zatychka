namespace Zatychka.Server.Models
{
    public class DeviceStatus
    {
        public int Id { get; set; }

        public int DeviceId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime ActivationDate { get; set; }

        // Навигационное свойство
        public Device Device { get; set; }
    }
}
