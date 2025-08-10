namespace Zatychka.Server.DTOs
{
    public class UserProfileDto
    {
        public int Id { get; set; }
        public string Login { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public string Role { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
    }

    public class UpdateUserRequest
    {
        public string Login { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Phone { get; set; } = null!;
    }

    public class ChangePasswordRequest
    {
        public string NewPassword { get; set; } = null!;
        public string? ConfirmPassword { get; set; }
    }
}
