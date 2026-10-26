using System.ComponentModel.DataAnnotations;

namespace RestaurantAPI.Models.DTOs;

public class CustomerReservationFeedbackDto
{
    public int ReservationID { get; set; }
    public DateTime ReservationTime { get; set; }
    public int NumberOfGuests { get; set; }
    public string? Status { get; set; }
    public string? TableName { get; set; }
    public string? AreaName { get; set; }
    public bool CanReview { get; set; }
    public ReservationFeedbackListDto? Feedback { get; set; }
}

public class ReservationFeedbackListDto
{
    public int ReservationFeedbackID { get; set; }
    public int ReservationID { get; set; }
    public int CustomerID { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public byte Rating { get; set; }
    public string? Content { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? AreaName { get; set; }
    public string? TableName { get; set; }
}

public class SubmitReservationFeedbackDto
{
    [Required]
    [EmailAddress]
    public string CustomerEmail { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int ReservationID { get; set; }

    [Range(1, 5)]
    public byte Rating { get; set; }

    [StringLength(1000)]
    public string? Content { get; set; }
}

public class UpdateReservationFeedbackDto
{
    [Required]
    [EmailAddress]
    public string CustomerEmail { get; set; } = string.Empty;

    [Range(1, 5)]
    public byte Rating { get; set; }

    [StringLength(1000)]
    public string? Content { get; set; }
}
