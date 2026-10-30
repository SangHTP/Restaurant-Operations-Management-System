using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantAPI.Models;

[Table("Roles")]
public class Role
{
    [Key]
    public int RoleID { get; set; }

    [Required]
    [StringLength(50)]
    public string RoleName { get; set; } = string.Empty;

    [StringLength(255)]
    public string? Description { get; set; }
}
