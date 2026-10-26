using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantAPI.Models;

[Table("Tables")]
public class Table
{
    [Key]
    public int TableID { get; set; }

    public int AreaID { get; set; }

    [ForeignKey("AreaID")]
    public Area? Area { get; set; }

    [Required]
    [StringLength(50)]
    public string TableName { get; set; } = string.Empty;

    public int Capacity { get; set; }

    [StringLength(50)]
    public string Status { get; set; } = "Trống";
}
