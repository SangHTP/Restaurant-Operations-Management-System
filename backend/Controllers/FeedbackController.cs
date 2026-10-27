using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantAPI.Data;
using RestaurantAPI.Models;
using RestaurantAPI.Models.DTOs;

namespace RestaurantAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FeedbackController : ControllerBase
{
    private readonly AppDbContext _context;

    public FeedbackController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>UC-52: View Feedback List</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<FeedbackListDto>>> GetFeedbacks(
        [FromQuery] FeedbackFilterDto filter)
    {
        var query = _context.Feedbacks
            .Include(f => f.Replies)
            .AsQueryable();

        if (filter.MinRating.HasValue)
            query = query.Where(f => f.Rating >= filter.MinRating.Value);
        if (filter.MaxRating.HasValue)
            query = query.Where(f => f.Rating <= filter.MaxRating.Value);
        if (filter.IsHidden.HasValue)
            query = query.Where(f => f.IsHidden == filter.IsHidden.Value);
        if (filter.FromDate.HasValue)
            query = query.Where(f => f.CreatedAt >= filter.FromDate.Value);
        if (filter.ToDate.HasValue)
            query = query.Where(f => f.CreatedAt <= filter.ToDate.Value.AddDays(1));

        var totalCount = await query.CountAsync();

        var feedbacks = await query
            .OrderByDescending(f => f.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(f => new FeedbackListDto
            {
                FeedbackID = f.FeedbackID,
                BillID = f.BillID,
                CustomerID = f.CustomerID,
                CustomerName = f.CustomerName,
                CustomerPhone = f.CustomerPhone,
                Rating = f.Rating,
                Content = f.Content,
                IsHidden = f.IsHidden,
                HiddenReason = f.HiddenReason,
                CreatedAt = f.CreatedAt,
                ReplyCount = f.Replies.Count
            })
            .ToListAsync();

        return Ok(new PagedResult<FeedbackListDto>
        {
            Items = feedbacks,
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize
        });
    }

    /// <summary>UC-53: View Feedback Detail</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<FeedbackDetailDto>> GetFeedback(int id)
    {
        var feedback = await _context.Feedbacks
            .Include(f => f.Bill)
            .Include(f => f.Replies)
                .ThenInclude(r => r.Employee)
            .FirstOrDefaultAsync(f => f.FeedbackID == id);

        if (feedback == null) return NotFound(new { message = "Feedback không tồn tại." });

        return Ok(new FeedbackDetailDto
        {
            FeedbackID = feedback.FeedbackID,
            BillID = feedback.BillID,
            BillFinalAmount = feedback.Bill?.FinalAmount ?? 0,
            CustomerID = feedback.CustomerID,
            CustomerName = feedback.CustomerName,
            CustomerPhone = feedback.CustomerPhone,
            Rating = feedback.Rating,
            Content = feedback.Content,
            IsHidden = feedback.IsHidden,
            HiddenReason = feedback.HiddenReason,
            CreatedAt = feedback.CreatedAt,
            Replies = feedback.Replies.Select(r => new FeedbackReplyDto
            {
                ReplyID = r.ReplyID,
                FeedbackID = r.FeedbackID,
                EmployeeID = r.EmployeeID,
                EmployeeName = r.Employee?.FullName,
                ReplyContent = r.ReplyContent,
                CreatedAt = r.CreatedAt
            }).ToList()
        });
    }

    /// <summary>UC-51: Submit Rating & Feedback (Customer)</summary>
    [HttpPost("submit")]
    public async Task<ActionResult<FeedbackDetailDto>> SubmitFeedback([FromBody] SubmitFeedbackDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        // Validate bill exists
        var bill = await _context.Bills.FindAsync(dto.BillID);
        if (bill == null) return NotFound(new { message = "Hóa đơn không tồn tại." });

        // Check if feedback already submitted
        var existing = await _context.Feedbacks.AnyAsync(f => f.BillID == dto.BillID);
        if (existing) return Conflict(new { message = "Hóa đơn này đã được đánh giá." });

        if (dto.Rating < 1 || dto.Rating > 5)
            return BadRequest(new { message = "Điểm đánh giá phải từ 1 đến 5." });

        var feedback = new Feedback
        {
            BillID = dto.BillID,
            CustomerID = dto.CustomerID,
            CustomerName = dto.CustomerName,
            CustomerPhone = dto.CustomerPhone,
            Rating = dto.Rating,
            Content = dto.Content,
            IsHidden = false,
            CreatedAt = DateTime.Now
        };

        _context.Feedbacks.Add(feedback);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetFeedback), new { id = feedback.FeedbackID },
            new { feedbackID = feedback.FeedbackID, message = "Cảm ơn bạn đã đánh giá!" });
    }

    /// <summary>UC-54: Create Feedback (Internal/Admin)</summary>
    [HttpPost]
    public async Task<ActionResult> CreateFeedback([FromBody] CreateFeedbackDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var bill = await _context.Bills.FindAsync(dto.BillID);
        if (bill == null) return NotFound(new { message = "Hóa đơn không tồn tại." });

        var existing = await _context.Feedbacks.AnyAsync(f => f.BillID == dto.BillID);
        if (existing) return Conflict(new { message = "Hóa đơn đã có feedback." });

        var feedback = new Feedback
        {
            BillID = dto.BillID,
            CustomerID = dto.CustomerID,
            CustomerName = dto.CustomerName,
            CustomerPhone = dto.CustomerPhone,
            Rating = dto.Rating,
            Content = dto.Content,
            CreatedAt = DateTime.Now
        };

        _context.Feedbacks.Add(feedback);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetFeedback), new { id = feedback.FeedbackID },
            new { feedbackID = feedback.FeedbackID });
    }

    /// <summary>UC-55: Update Feedback</summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateFeedback(int id, [FromBody] UpdateFeedbackDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var feedback = await _context.Feedbacks.FindAsync(id);
        if (feedback == null) return NotFound(new { message = "Feedback không tồn tại." });

        if (dto.Rating < 1 || dto.Rating > 5)
            return BadRequest(new { message = "Điểm đánh giá phải từ 1 đến 5." });

        feedback.Rating = dto.Rating;
        feedback.Content = dto.Content;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>UC-56: Delete Feedback</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFeedback(int id)
    {
        var feedback = await _context.Feedbacks
            .Include(f => f.Replies)
            .FirstOrDefaultAsync(f => f.FeedbackID == id);

        if (feedback == null) return NotFound(new { message = "Feedback không tồn tại." });

        _context.Feedbacks.Remove(feedback);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>UC-57: Reply to Customer Feedback</summary>
    [HttpPost("{id}/replies")]
    public async Task<ActionResult<FeedbackReplyDto>> ReplyToFeedback(
        int id, [FromBody] ReplyFeedbackDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var feedback = await _context.Feedbacks.FindAsync(id);
        if (feedback == null) return NotFound(new { message = "Feedback không tồn tại." });

        var employee = await _context.Employees.FindAsync(dto.EmployeeID);
        if (employee == null) return NotFound(new { message = "Nhân viên không tồn tại." });

        var reply = new FeedbackReply
        {
            FeedbackID = id,
            EmployeeID = dto.EmployeeID,
            ReplyContent = dto.ReplyContent,
            CreatedAt = DateTime.Now
        };

        _context.FeedbackReplies.Add(reply);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetFeedback), new { id }, new FeedbackReplyDto
        {
            ReplyID = reply.ReplyID,
            FeedbackID = reply.FeedbackID,
            EmployeeID = reply.EmployeeID,
            EmployeeName = employee.FullName,
            ReplyContent = reply.ReplyContent,
            CreatedAt = reply.CreatedAt
        });
    }

    /// <summary>UC-57: Get replies of a feedback</summary>
    [HttpGet("{id}/replies")]
    public async Task<ActionResult<IEnumerable<FeedbackReplyDto>>> GetReplies(int id)
    {
        var replies = await _context.FeedbackReplies
            .Include(r => r.Employee)
            .Where(r => r.FeedbackID == id)
            .OrderBy(r => r.CreatedAt)
            .Select(r => new FeedbackReplyDto
            {
                ReplyID = r.ReplyID,
                FeedbackID = r.FeedbackID,
                EmployeeID = r.EmployeeID,
                EmployeeName = r.Employee != null ? r.Employee.FullName : null,
                ReplyContent = r.ReplyContent,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        return Ok(replies);
    }

    /// <summary>UC-58: Hide Inappropriate Feedback</summary>
    [HttpPatch("{id}/hide")]
    public async Task<IActionResult> HideFeedback(int id, [FromBody] HideFeedbackDto dto)
    {
        var feedback = await _context.Feedbacks.FindAsync(id);
        if (feedback == null) return NotFound(new { message = "Feedback không tồn tại." });

        feedback.IsHidden = true;
        feedback.HiddenReason = dto.HiddenReason;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Feedback đã được ẩn.", feedbackID = id });
    }

    /// <summary>UC-58: Unhide Feedback</summary>
    [HttpPatch("{id}/unhide")]
    public async Task<IActionResult> UnhideFeedback(int id)
    {
        var feedback = await _context.Feedbacks.FindAsync(id);
        if (feedback == null) return NotFound(new { message = "Feedback không tồn tại." });

        feedback.IsHidden = false;
        feedback.HiddenReason = null;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Feedback đã được hiển thị lại.", feedbackID = id });
    }

    /// <summary>Get feedback statistics summary</summary>
    [HttpGet("statistics")]
    public async Task<IActionResult> GetFeedbackStatistics()
    {
        var stats = await _context.Feedbacks
            .GroupBy(f => f.Rating)
            .Select(g => new { Rating = g.Key, Count = g.Count() })
            .ToListAsync();

        var total = await _context.Feedbacks.CountAsync();
        var avgRating = total > 0 ? await _context.Feedbacks.AverageAsync(f => (double)f.Rating) : 0;
        var hiddenCount = await _context.Feedbacks.CountAsync(f => f.IsHidden);

        return Ok(new
        {
            TotalFeedbacks = total,
            AverageRating = Math.Round(avgRating, 2),
            HiddenCount = hiddenCount,
            RatingDistribution = stats.OrderBy(s => s.Rating)
        });
    }
}
