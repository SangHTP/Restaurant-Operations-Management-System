using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantAPI.Data;
using RestaurantAPI.Models.DTOs;

namespace RestaurantAPI.Controllers;

[ApiController]
[Route("api/customer-reservations")]
public class CustomerReservationsController : ControllerBase
{
    private readonly AppDbContext _context;

    public CustomerReservationsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CustomerReservationFeedbackDto>>> GetForCustomer(
        [FromQuery] string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest(new { message = "Customer email is required." });

        var customer = await _context.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Email == email);

        if (customer == null)
            return NotFound(new { message = "This account is not linked to a customer record." });

        var reservations = await _context.Reservations
            .AsNoTracking()
            .Include(reservation => reservation.Table)
                .ThenInclude(table => table!.Area)
            .Include(reservation => reservation.Feedbacks)
            .Where(reservation => reservation.CustomerID == customer.CustomerID)
            .OrderByDescending(reservation => reservation.ReservationTime)
            .ToListAsync();

        return Ok(reservations.Select(reservation =>
        {
            var feedback = reservation.Feedbacks.FirstOrDefault();
            return new CustomerReservationFeedbackDto
            {
                ReservationID = reservation.ReservationID,
                ReservationTime = reservation.ReservationTime,
                NumberOfGuests = reservation.NumberOfGuests,
                Status = reservation.Status,
                TableName = reservation.Table?.TableName,
                AreaName = reservation.Table?.Area?.AreaName,
                CanReview = ReservationFeedbackController.IsReviewEligible(reservation.Status, reservation.ReservationTime),
                Feedback = feedback == null ? null : new ReservationFeedbackListDto
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
                }
            };
        }));
    }

    [HttpPatch("{id:int}/cancel")]
    public async Task<IActionResult> CancelForCustomer(int id, [FromQuery] string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest(new { message = "Customer email is required." });

        var customer = await _context.Customers
            .FirstOrDefaultAsync(item => item.Email == email);

        if (customer == null)
            return NotFound(new { message = "This account is not linked to a customer record." });

        var reservation = await _context.Reservations
            .FirstOrDefaultAsync(item => item.ReservationID == id);

        if (reservation == null)
            return NotFound(new { message = "Reservation not found." });

        if (reservation.CustomerID != customer.CustomerID)
            return Forbid();

        if (reservation.Status is not ("Chờ xác nhận" or "Đã xác nhận"))
            return BadRequest(new { message = "Only pending or confirmed reservations can be cancelled." });

        reservation.Status = "Đã hủy";
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
