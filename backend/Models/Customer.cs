using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantAPI.Models;

[Table("Customers")]
public class Customer
{
    [Key]
    public int CustomerID { get; set; }

    [Required]
    [StringLength(100)]
    public string FullName { get; set; } = string.Empty;

    [StringLength(15)]
    public string Phone { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Email { get; set; }

    public int RewardPoints { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
