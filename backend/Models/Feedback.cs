using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantAPI.Models;

[Table("Feedbacks")]
public class Feedback
{
    [Key]
    public int FeedbackID { get; set; }

    public int BillID { get; set; }

    [ForeignKey("BillID")]
    public Bill? Bill { get; set; }

    public int? CustomerID { get; set; }

    [ForeignKey("CustomerID")]
    public Customer? Customer { get; set; }

    [StringLength(100)]
    public string? CustomerName { get; set; }

    [StringLength(15)]
    public string? CustomerPhone { get; set; }

    [Range(1, 5)]
    public byte Rating { get; set; }

    [StringLength(1000)]
    public string? Content { get; set; }

    public bool IsHidden { get; set; } = false;

    [StringLength(200)]
    public string? HiddenReason { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    // Navigation
    public ICollection<FeedbackReply> Replies { get; set; } = new List<FeedbackReply>();
}
