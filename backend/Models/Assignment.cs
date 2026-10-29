using backend.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantAPI.Models;

[Table("Assignments")]
public class Assignment
{
    [Key]
    public int AssignmentID { get; set; }

    public int EmployeeID { get; set; }

    [ForeignKey("EmployeeID")]
    public Employee? Employee { get; set; }

    public int? AreaID { get; set; }

    [ForeignKey("AreaID")]
    public Area? Area { get; set; }

    public int ShiftID { get; set; }

    [ForeignKey("ShiftID")]
    public Shift? Shift { get; set; }

    public DateTime ShiftDate { get; set; }
}

[Table("Shifts")]
public class Shift
{
    [Key]
    public int ShiftID { get; set; }

    [Required]
    [StringLength(50)]
    public string ShiftName { get; set; } = string.Empty;

    public TimeSpan StartTime { get; set; }

    public TimeSpan EndTime { get; set; }
}
