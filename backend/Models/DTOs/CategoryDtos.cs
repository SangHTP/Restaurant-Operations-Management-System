
using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    public class CreateCategoryDto
    {
        [Required(ErrorMessage = "Tên danh mục không được để trống.")]
        [StringLength(100, MinimumLength = 1,
            ErrorMessage = "Tên danh mục phải có tối đa 100 ký tự.")]
        public string CategoryName { get; set; } = string.Empty;
    }

    public class UpdateCategoryDto
    {
        [Required(ErrorMessage = "Tên danh mục không được để trống.")]
        [StringLength(100, MinimumLength = 1,
            ErrorMessage = "Tên danh mục phải có tối đa 100 ký tự.")]
        public string CategoryName { get; set; } = string.Empty;
    }
}
