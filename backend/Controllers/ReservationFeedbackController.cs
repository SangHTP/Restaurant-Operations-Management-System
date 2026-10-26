using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantAPI.Data;
using RestaurantAPI.Models;
using RestaurantAPI.Models.DTOs;

namespace RestaurantAPI.Controllers;

[ApiController]
[Route("api/reservation-feedback")]
public class ReservationFeedbackController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReservationFeedbackController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ReservationFeedbackListDto>>> GetAll()
    {
        var feedback = await _context.ReservationFeedbacks
            .AsNoTracking()
            .Include(item => item.Customer)
            .Include(item => item.Reservation)
                .ThenInclude(reservation => reservation!.Table)
                    .ThenInclude(table => table!.Area)
            .OrderByDescending(item => item.CreatedAt)
            .ToListAsync();

        return Ok(feedback.Select(item => new ReservationFeedbackListDto
            {
                ReservationFeedbackID = item.ReservationFeedbackID,
                ReservationID = item.ReservationID,
                CustomerID = item.CustomerID,
                CustomerName = item.Customer?.FullName ?? "Customer",
                Rating = item.Rating,
                Content = item.Content,
                CreatedAt = item.CreatedAt,
                TableName = item.Reservation?.Table?.TableName,
                AreaName = item.Reservation?.Table?.Area?.AreaName
            }));
    }

    [HttpPost]
    public async Task<ActionResult<ReservationFeedbackListDto>> Submit(
        [FromBody] SubmitReservationFeedbackDto dto)
    {
        var customer = await _context.Customers
            .FirstOrDefaultAsync(item => item.Email == dto.CustomerEmail);

        if (customer == null)
            return NotFound(new { message = "This account is not linked to a customer record." });

        var reservation = await _context.Reservations
            .Include(item => item.Table)
                .ThenInclude(table => table!.Area)
            .FirstOrDefaultAsync(item => item.ReservationID == dto.ReservationID);

        if (reservation == null)
            return NotFound(new { message = "Reservation not found." });

        if (reservation.CustomerID != customer.CustomerID)
            return Forbid();

        if (!IsReviewEligible(reservation.Status, reservation.ReservationTime))
            return BadRequest(new { message = "Reviews are available after the reservation has been completed." });

        var alreadyReviewed = await _context.ReservationFeedbacks
            .AnyAsync(item => item.ReservationID == reservation.ReservationID);

        if (alreadyReviewed)
            return Conflict(new { message = "This reservation has already been reviewed." });

        var feedback = new ReservationFeedback
        {
            ReservationID = reservation.ReservationID,
            CustomerID = customer.CustomerID,
            Rating = dto.Rating,
            Content = string.IsNullOrWhiteSpace(dto.Content) ? null : dto.Content.Trim(),
            CreatedAt = DateTime.Now
        };

        _context.ReservationFeedbacks.Add(feedback);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new ReservationFeedbackListDto
        {
            ReservationFeedbackID = feedback.ReservationFeedbackID,
            ReservationID = feedback.ReservationID,
            CustomerID = feedback.CustomerID,
            CustomerName = customer.FullName,
            Rating = feedback.Rating,
            Content = feedback.Content,
            CreatedAt = feedback.CreatedAt,
            TableName = reservation.Table?.TableName,
            AreaName = reservation.Table?.Area?.AreaName
        });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id, [FromBody] UpdateReservationFeedbackDto dto)
    {
        var feedback = await _context.ReservationFeedbacks
            .Include(item => item.Customer)
            .Include(item => item.Reservation)
            .FirstOrDefaultAsync(item => item.ReservationFeedbackID == id);

        if (feedback == null)
            return NotFound(new { message = "Review not found." });

        if (!string.Equals(feedback.Customer?.Email, dto.CustomerEmail, StringComparison.OrdinalIgnoreCase))
            return Forbid();

        if (feedback.Reservation == null ||
            !IsReviewEligible(feedback.Reservation.Status, feedback.Reservation.ReservationTime))
            return BadRequest(new { message = "This reservation is no longer eligible for review updates." });

        feedback.Rating = dto.Rating;
        feedback.Content = string.IsNullOrWhiteSpace(dto.Content) ? null : dto.Content.Trim();
        feedback.CreatedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    public static bool IsReviewEligible(string? status, DateTime reservationTime)
    {
        if (status is "Completed" or "Hoàn thành")
            return true;

        return status == "Đã đến" && reservationTime <= DateTime.Now.AddHours(-2);
    }
}
