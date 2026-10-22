using System;
using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    public class CreatePromotionDto
    {
        [Required(ErrorMessage = "Mã khuyến mãi không được để trống")]
        public string Code { get; set; } = string.Empty;

        public string? PromotionName { get; set; }

        [Required]
        [RegularExpression("^(Amount|Percent)$", ErrorMessage = "DiscountType chỉ được là 'Amount' hoặc 'Percent'")]
        public string DiscountType { get; set; } = "Amount";

        [Range(0, double.MaxValue, ErrorMessage = "Giá trị giảm giá phải lớn hơn hoặc bằng 0")]
        public decimal DiscountValue { get; set; }

        public decimal MinOrderValue { get; set; } = 0;

        [Range(0, int.MaxValue, ErrorMessage = "Số lượng mã phải lớn hơn hoặc bằng 0")]
        public int Count { get; set; } = 0;

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class UpdatePromotionDto : CreatePromotionDto
    {
    }

    public class CheckPromotionDto
    {
        [Required]
        public string Code { get; set; } = string.Empty;

        [Required]
        public decimal OrderAmount { get; set; }
    }
}