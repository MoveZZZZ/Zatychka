using System.Text;
using Zatychka.Server.Models;
using Zatychka.Server.Repositories;
using Zatychka.Server.DTOs;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using Zatychka.Server.DTOs;

namespace Zatychka.Server.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepo;
        private readonly JwtService _jwtService;

        public UserService(IUserRepository userRepo, JwtService jwtService)
        {
            _userRepo = userRepo;
            _jwtService = jwtService;
        }

        public async Task RegisterAsync(RegisterRequest request)
        {

            if (string.IsNullOrWhiteSpace(request.Login))
                throw new Exception("Логин обязателен");

            if (request.Login.Length < 3 || request.Login.Length > 20)
                throw new Exception("Логин должен быть от 3 до 20 символов");

            var loginExists = await _userRepo.GetByLoginAsync(request.Login);
            if (loginExists != null)
                throw new Exception("Логин уже используется");

            if (string.IsNullOrWhiteSpace(request.Email))
                throw new Exception("Email обязателен");

            var emailRegex = new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$");
            if (!emailRegex.IsMatch(request.Email))
                throw new Exception("Неверный формат email");

            var existing = await _userRepo.GetByEmailAsync(request.Email);
            if (existing != null)
                throw new Exception("Email уже зарегистрирован");


            if (string.IsNullOrWhiteSpace(request.Phone))
                throw new Exception("Телефон обязателен");

            var phoneRegex = new Regex(@"^\+\d{8,15}$");
            if (!phoneRegex.IsMatch(request.Phone))
                throw new Exception("Неверный формат телефона");

            if (string.IsNullOrWhiteSpace(request.Phone) || request.Phone.Length < 5 || request.Phone.Length > 32)
                throw new ArgumentException("Некорректный номер телефона");

            if (string.IsNullOrWhiteSpace(request.Password))
                throw new Exception("Пароль обязателен");

            if (request.Password.Length < 8)
                throw new Exception("Пароль должен быть не менее 8 символов");

            var passwordRegex = new Regex(@"^(?=.*[A-Za-z])(?=.*\d).+$");
            if (!passwordRegex.IsMatch(request.Password))
                throw new Exception("Пароль должен содержать хотя бы одну букву и одну цифру");


            var hash = HashPassword(request.Password);
            var user = new User
            {
                Login = request.Login,
                Email = request.Email,
                Phone = request.Phone,
                PasswordHash = hash,
                Role = request.Role
            };

            await _userRepo.AddUserAsync(user);
        }

        public async Task<UserProfileDto> GetProfileAsync(int userId)
        {
            var u = await _userRepo.GetByIdAsync(userId) ?? throw new Exception("Пользователь не найден");
            return ToDto(u);
        }
        public async Task<UserProfileDto> UpdateProfileAsync(int userId, UpdateUserRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Login) || request.Login.Length < 3 || request.Login.Length > 32)
                throw new ArgumentException("Логин должен быть от 3 до 32 символов");
            if (!Regex.IsMatch(request.Login, @"^[a-zA-Z0-9._-]+$"))
                throw new ArgumentException("Логин может содержать только латинские буквы, цифры, . _ -");

            if (string.IsNullOrWhiteSpace(request.Email) || request.Email.Length > 128 ||
                !Regex.IsMatch(request.Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                throw new ArgumentException("Некорректный email");

            if (string.IsNullOrWhiteSpace(request.Phone) || request.Phone.Length < 5 || request.Phone.Length > 32)
                throw new ArgumentException("Некорректный номер телефона");

            if (await _userRepo.ExistsLoginAsync(request.Login, userId)) throw new ArgumentException("Логин уже используется");
            if (await _userRepo.ExistsEmailAsync(request.Email, userId)) throw new ArgumentException("Email уже используется");
            if (await _userRepo.ExistsPhoneAsync(request.Phone, userId)) throw new ArgumentException("Телефон уже используется");

            var u = await _userRepo.GetByIdAsync(userId) ?? throw new Exception("Пользователь не найден");
            u.Login = request.Login.Trim();
            u.Email = request.Email.Trim();
            u.Phone = request.Phone.Trim();

            await _userRepo.UpdateAsync(u);
            await _userRepo.SaveChangesAsync();

            return ToDto(u);
        }
        public async Task ChangePasswordAsync(int userId, ChangePasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 8)
                throw new ArgumentException("Пароль должен быть не короче 8 символов");
            if (!string.IsNullOrEmpty(request.ConfirmPassword) && request.NewPassword != request.ConfirmPassword)
                throw new ArgumentException("Пароли не совпадают");
            var passwordRegex = new Regex(@"^(?=.*[A-Za-z])(?=.*\d).+$");
            if (!passwordRegex.IsMatch(request.NewPassword))
                throw new Exception("Пароль должен содержать хотя бы одну букву и одну цифру");

            var u = await _userRepo.GetByIdAsync(userId) ?? throw new Exception("Пользователь не найден");
            u.PasswordHash = HashPassword(request.NewPassword);

            await _userRepo.UpdateAsync(u);
            await _userRepo.SaveChangesAsync();
        }


        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(password);
            var hash = sha256.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }
        public async Task<(User user, TokenPair tokens)> LoginAsync(LoginRequest request)
        {
            var user = await _userRepo.GetByEmailAsync(request.Email);
            if (user == null)
                throw new Exception("Неверный email или пароль");

            var hash = HashPassword(request.Password);
            if (user.PasswordHash != hash)
                throw new Exception("Неверный email или пароль");

            var tokens = _jwtService.GenerateTokenPair(user);

            return (user,tokens);
        }
        private static UserProfileDto ToDto(User u) => new()
        {
            Id = u.Id,
            Login = u.Login,
            Email = u.Email,
            Phone = u.Phone,
            Role = u.Role,
            CreatedAt = u.CreatedAt
        };

    }
}
