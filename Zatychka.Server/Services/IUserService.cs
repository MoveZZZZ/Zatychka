using Zatychka.Server.DTOs;
using Zatychka.Server.Models;
namespace Zatychka.Server.Services
{
    public interface IUserService
    {
        Task RegisterAsync(RegisterRequest request);
        Task<(User user, TokenPair tokens)> LoginAsync(LoginRequest request);

        Task<UserProfileDto> GetProfileAsync(int userId);
        Task<UserProfileDto> UpdateProfileAsync(int userId, UpdateUserRequest request);
        Task ChangePasswordAsync(int userId, ChangePasswordRequest request);
    }
}
