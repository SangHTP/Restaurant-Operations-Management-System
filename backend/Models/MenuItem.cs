using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantAPI.Models;

[Table("MenuItems")]
public class MenuItem
{
    [Key]
    public int MenuItemID { get; set; }

    public int CategoryID { get; set; }

    [ForeignKey("CategoryID")]
    public Category? Category { get; set; }

    [Required]
    [StringLength(150)]
    public string ItemName { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,0)")]
    public decimal Price { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    [StringLength(255)]
    public string? ImageUrl { get; set; }

    public bool IsActive { get; set; } = true;
}
