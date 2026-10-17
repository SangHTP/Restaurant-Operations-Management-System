using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    public class LoginRequestDto
    {
        [Required(ErrorMessage = "Email hoặc Tên đăng nhập không được để trống.")]
        public string EmailOrUsername { get; set; } = string.Empty;

        public string? Password { get; set; }
    }

    public class UserResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public int RewardPoints { get; set; }
        public string Status { get; set; } = "Active";
    }

    public class RegisterCustomerDto
    {
        [Required(ErrorMessage = "Họ tên không được để trống.")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Số điện thoại không được để trống.")]
        public string Phone { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "Email không hợp lệ.")]
        public string? Email { get; set; }
    }
}
