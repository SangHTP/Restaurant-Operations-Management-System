using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantAPI.Models;

[Table("ActionLogs")]
public class ActionLog
{
    [Key]
    public int LogID { get; set; }

    public int EmployeeID { get; set; }

    [Required]
    public string ActionType { get; set; } = string.Empty;

    [Required]
    public string ReferenceTable { get; set; } = string.Empty;

    public int ReferenceID { get; set; }

    public string? Description { get; set; }

    public DateTime? CreatedAt { get; set; }
}