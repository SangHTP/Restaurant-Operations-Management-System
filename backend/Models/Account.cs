using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantAPI.Models;

[Table("Accounts")]
public class Account
{
    [Key]
    public int AccountID { get; set; }

    public int EmployeeID { get; set; }

    [Required]
    [StringLength(255)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [StringLength(255)]
    public string PasswordHash { get; set; } = string.Empty;

    public bool? IsActive { get; set; }
}