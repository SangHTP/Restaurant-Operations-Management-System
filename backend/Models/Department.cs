using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantAPI.Models;

[Table("Departments")]
public class Department
{
    [Key]
    public int DepartmentID { get; set; }

    [Required]
    [StringLength(100)]
    public string DepartmentName { get; set; } = string.Empty;

    [StringLength(255)]
    public string? Description { get; set; }
}
