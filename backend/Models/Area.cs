using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantAPI.Models;

[Table("Areas")]
public class Area
{
    [Key]
    public int AreaID { get; set; }

    [Required]
    [StringLength(100)]
    public string AreaName { get; set; } = string.Empty;

    [StringLength(255)]
    public string? Description { get; set; }

    // Navigation
    public ICollection<Table> Tables { get; set; } = new List<Table>();
}
