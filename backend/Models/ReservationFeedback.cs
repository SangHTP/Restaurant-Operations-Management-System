using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantAPI.Models;

[Table("ReservationFeedbacks")]
public class ReservationFeedback
{
    [Key]
    public int ReservationFeedbackID { get; set; }

    public int ReservationID { get; set; }

    [ForeignKey(nameof(ReservationID))]
    public Reservation? Reservation { get; set; }

    public int CustomerID { get; set; }

    [ForeignKey(nameof(CustomerID))]
    public Customer? Customer { get; set; }

    [Range(1, 5)]
    public byte Rating { get; set; }

    [StringLength(1000)]
    public string? Content { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
