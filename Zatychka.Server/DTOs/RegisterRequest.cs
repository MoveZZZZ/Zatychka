namespace Zatychka.Server.DTOs
{
    public class RegisterRequest
    {
        public string Login { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Password { get; set; }
        public string Role { get; set; }
    }
}
