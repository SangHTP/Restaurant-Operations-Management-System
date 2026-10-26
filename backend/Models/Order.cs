using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantAPI.Models;

[Table("Orders")]
public class Order
{
    [Key]
    public int OrderID { get; set; }

    public int EmployeeID { get; set; }

    [ForeignKey("EmployeeID")]
    public Employee? Employee { get; set; }

    public DateTime OrderTime { get; set; } = DateTime.Now;

    [StringLength(50)]
    public string Status { get; set; } = "Đang phục vụ";

    // Navigation
    public ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();
    public ICollection<OrderTable> OrderTables { get; set; } = new List<OrderTable>();
    public Bill? Bill { get; set; }
}
