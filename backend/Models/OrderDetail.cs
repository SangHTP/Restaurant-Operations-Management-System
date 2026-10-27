using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantAPI.Models;

[Table("OrderDetails")]
public class OrderDetail
{
    [Key]
    public int OrderDetailID { get; set; }

    public int OrderID { get; set; }

    [ForeignKey("OrderID")]
    public Order? Order { get; set; }

    public int MenuItemID { get; set; }

    [ForeignKey("MenuItemID")]
    public MenuItem? MenuItem { get; set; }

    public int Quantity { get; set; }

    [Column(TypeName = "decimal(18,0)")]
    public decimal UnitPrice { get; set; }

    [StringLength(255)]
    public string? Note { get; set; }

    [StringLength(50)]
    public string Status { get; set; } = "Chờ chế biến";

    public DateTime OrderTime { get; set; } = DateTime.Now;
}
