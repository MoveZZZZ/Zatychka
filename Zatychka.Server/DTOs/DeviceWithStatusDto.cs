namespace Zatychka.Server.DTO
{
    public class DeviceWithStatusDto
    {
        public int Id { get; set; }          // Device.Id
        public string Name { get; set; } = "";
        public string Model { get; set; } = "";   // из последней записи DevicesStatus
        public string Status { get; set; } = "";  // из последней записи DevicesStatus
    }
}
