using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantAPI.Models;

[Table("Payments")]
public class Payment
{
    [Key]
    public int PaymentID { get; set; }

    public int BillID { get; set; }

    [ForeignKey(nameof(BillID))]
    public Bill? Bill { get; set; }

    [Required]
    [StringLength(50)]
    public string PaymentMethod { get; set; } = string.Empty;

    [StringLength(100)]
    public string? TransactionNo { get; set; }

    [Column(TypeName = "decimal(18,0)")]
    public decimal AmountPaid { get; set; }

    public DateTime PaymentTime { get; set; } = DateTime.Now;

    [StringLength(50)]
    public string Status { get; set; } = "Đang xử lý";
}