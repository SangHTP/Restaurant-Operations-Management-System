using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantAPI.Models;

[Table("WorkAvailabilities")]
public class WorkAvailability
{
    [Key]
    public int AvailabilityID { get; set; }

    public int EmployeeID { get; set; }

    public int ShiftID { get; set; }

    public DateTime AvailableDate { get; set; }

    public string? Status { get; set; }
}