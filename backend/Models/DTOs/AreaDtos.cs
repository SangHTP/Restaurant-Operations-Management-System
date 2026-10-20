using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    public class CreateAreaDto
    {
        [Required(ErrorMessage = "Tên khu vực không được để trống.")]
        [StringLength(100, MinimumLength = 1, ErrorMessage = "Tên khu vực phải từ 1 đến 100 ký tự.")]
        public string AreaName { get; set; } = string.Empty;

        [StringLength(255, ErrorMessage = "Mô tả không được vượt quá 255 ký tự.")]
        public string? Description { get; set; }
    }

    public class UpdateAreaDto
    {
        [Required(ErrorMessage = "Tên khu vực không được để trống.")]
        [StringLength(100, MinimumLength = 1, ErrorMessage = "Tên khu vực phải từ 1 đến 100 ký tự.")]
        public string AreaName { get; set; } = string.Empty;

        [StringLength(255, ErrorMessage = "Mô tả không được vượt quá 255 ký tự.")]
        public string? Description { get; set; }
    }
}
