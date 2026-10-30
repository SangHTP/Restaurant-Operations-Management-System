namespace RestaurantAPI.Models.DTOs;

// ===== FEEDBACK DTOs =====
public class FeedbackListDto
{
    public int FeedbackID { get; set; }
    public int BillID { get; set; }
    public int? CustomerID { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public byte Rating { get; set; }
    public string? Content { get; set; }
    public bool IsHidden { get; set; }
    public string? HiddenReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public int ReplyCount { get; set; }
}

public class FeedbackDetailDto
{
    public int FeedbackID { get; set; }
    public int BillID { get; set; }
    public decimal BillFinalAmount { get; set; }
    public int? CustomerID { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public byte Rating { get; set; }
    public string? Content { get; set; }
    public bool IsHidden { get; set; }
    public string? HiddenReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<FeedbackReplyDto> Replies { get; set; } = new();
}

public class FeedbackReplyDto
{
    public int ReplyID { get; set; }
    public int FeedbackID { get; set; }
    public int EmployeeID { get; set; }
    public string? EmployeeName { get; set; }
    public string ReplyContent { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

// UC-51: Customer submits rating
public class SubmitFeedbackDto
{
    public int BillID { get; set; }
    public int? CustomerID { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public byte Rating { get; set; }
    public string? Content { get; set; }
}

// UC-54: Create feedback (internal)
public class CreateFeedbackDto
{
    public int BillID { get; set; }
    public int? CustomerID { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public byte Rating { get; set; }
    public string? Content { get; set; }
}

// UC-55: Update feedback
public class UpdateFeedbackDto
{
    public byte Rating { get; set; }
    public string? Content { get; set; }
}

// UC-57: Reply to feedback
public class ReplyFeedbackDto
{
    public int EmployeeID { get; set; }
    public string ReplyContent { get; set; } = string.Empty;
}

// UC-58: Hide feedback
public class HideFeedbackDto
{
    public string? HiddenReason { get; set; }
}

public class FeedbackFilterDto
{
    public byte? MinRating { get; set; }
    public byte? MaxRating { get; set; }
    public bool? IsHidden { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}
