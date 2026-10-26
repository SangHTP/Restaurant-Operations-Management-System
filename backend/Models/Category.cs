using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantAPI.Models;

[Table("Categories")]
public class Category
{
    [Key]
    public int CategoryID { get; set; }

    [Required]
    [StringLength(100)]
    public string CategoryName { get; set; } = string.Empty;

    // Navigation
    public ICollection<MenuItem> MenuItems { get; set; } = new List<MenuItem>();
}
