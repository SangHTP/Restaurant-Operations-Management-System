using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    public class CreateTableDto
    {
        [Required(ErrorMessage = "Vui lòng chọn khu vực.")]
        public int AreaID { get; set; }

        [Required(ErrorMessage = "Tên bàn không được để trống.")]
        [StringLength(50, MinimumLength = 1, ErrorMessage = "Tên bàn từ 1 đến 50 ký tự.")]
        public string TableName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Sức chứa không được để trống.")]
        [Range(1, 100, ErrorMessage = "Sức chứa phải từ 1 đến 100 người.")]
        public int Capacity { get; set; }

        [StringLength(50)]
        public string? Status { get; set; } = "Available";
    }

    public class UpdateTableDto
    {
        [Required(ErrorMessage = "Vui lòng chọn khu vực.")]
        public int AreaID { get; set; }

        [Required(ErrorMessage = "Tên bàn không được để trống.")]
        [StringLength(50, MinimumLength = 1, ErrorMessage = "Tên bàn từ 1 đến 50 ký tự.")]
        public string TableName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Sức chứa không được để trống.")]
        [Range(1, 100, ErrorMessage = "Sức chứa phải từ 1 đến 100 người.")]
        public int Capacity { get; set; }

        [Required(ErrorMessage = "Trạng thái bàn không được để trống.")]
        [StringLength(50)]
        public string Status { get; set; } = "Available";
    }
}
