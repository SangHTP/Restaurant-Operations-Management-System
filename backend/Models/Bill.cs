using backend.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantAPI.Models;

[Table("Bills")]
public class Bill
{
    [Key]
    public int BillID { get; set; }

    public int OrderID { get; set; }

    [ForeignKey("OrderID")]
    public Order? Order { get; set; }

    public int? PromotionID { get; set; }

    [ForeignKey("PromotionID")]
    public Promotion? Promotion { get; set; }

    [Column(TypeName = "decimal(18,0)")]
    public decimal SubTotal { get; set; }

    [Column(TypeName = "decimal(18,0)")]
    public decimal DiscountAmount { get; set; } = 0;

    [Column(TypeName = "decimal(18,0)")]
    public decimal TaxAmount { get; set; } = 0;

    [Column(TypeName = "decimal(18,0)")]
    public decimal FinalAmount { get; set; }

    public int CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    // Navigation
    public Feedback? Feedback { get; set; }
}
