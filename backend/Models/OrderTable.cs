using backend.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantAPI.Models;

[Table("OrderTables")]
public class OrderTable
{
    public int OrderID { get; set; }

    [ForeignKey("OrderID")]
    public Order? Order { get; set; }

    public int TableID { get; set; }

    [ForeignKey("TableID")]
    public Table? Table { get; set; }
}
