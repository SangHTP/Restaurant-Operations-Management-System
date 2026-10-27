using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantAPI.Models;

[Table("Employees")]
public class Employee
{
    [Key]
    public int EmployeeID { get; set; }

    public int RoleID { get; set; }

    [ForeignKey("RoleID")]
    public Role? Role { get; set; }

    [Required]
    [StringLength(100)]
    public string FullName { get; set; } = string.Empty;

    [StringLength(15)]
    public string Phone { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Email { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public int? DepartmentID { get; set; }

    [ForeignKey("DepartmentID")]
    public Department? Department { get; set; }

    // Navigation
    public ICollection<FeedbackReply> FeedbackReplies { get; set; } = new List<FeedbackReply>();
}
