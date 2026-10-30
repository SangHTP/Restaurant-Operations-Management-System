using backend.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantAPI.Models;

[Table("Reservations")]
public class Reservation
{
    [Key]
    public int ReservationID { get; set; }

    public int? TableID { get; set; }

    [ForeignKey(nameof(TableID))]
    public Table? Table { get; set; }

    public int EmployeeID { get; set; }

    public int? CustomerID { get; set; }

    [Required]
    public string CustomerName { get; set; } = string.Empty;

    [Required]
    public string CustomerPhone { get; set; } = string.Empty;

    public DateTime ReservationTime { get; set; }

    public int NumberOfGuests { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public ICollection<ReservationFeedback> Feedbacks { get; set; } = new List<ReservationFeedback>();
}