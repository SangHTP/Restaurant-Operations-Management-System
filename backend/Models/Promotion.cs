using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("Promotions")]
    public class Promotion
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int PromotionID { get; set; }

        [Required]
        [StringLength(50)]
        public string Code { get; set; } = string.Empty;

        [StringLength(150)]
        public string? PromotionName { get; set; }

        [Required]
        [StringLength(20)]
        public string DiscountType { get; set; } = "Amount"; 

        [Column(TypeName = "decimal(18, 0)")]
        public decimal DiscountValue { get; set; }

        [Column(TypeName = "decimal(18, 0)")]
        public decimal MinOrderValue { get; set; } = 0;

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public bool IsActive { get; set; } = true;
    }
}