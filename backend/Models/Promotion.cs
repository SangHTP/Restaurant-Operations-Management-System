using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantAPI.Models;

[Table("Promotions")]
public class Promotion
{
    [Key]
    public int PromotionID { get; set; }

    [Required]
    [StringLength(50)]
    public string Code { get; set; } = string.Empty;

    [StringLength(150)]
    public string? PromotionName { get; set; }

    [StringLength(20)]
    public string DiscountType { get; set; } = "Percent";

    [Column(TypeName = "decimal(18,0)")]
    public decimal DiscountValue { get; set; }

    [Column(TypeName = "decimal(18,0)")]
    public decimal MinOrderValue { get; set; } = 0;

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<Bill> Bills { get; set; } = new List<Bill>();
}
