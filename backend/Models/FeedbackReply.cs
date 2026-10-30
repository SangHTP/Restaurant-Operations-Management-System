using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantAPI.Models;

[Table("FeedbackReplies")]
public class FeedbackReply
{
    [Key]
    public int ReplyID { get; set; }

    public int FeedbackID { get; set; }

    [ForeignKey("FeedbackID")]
    public Feedback? Feedback { get; set; }

    public int EmployeeID { get; set; }

    [ForeignKey("EmployeeID")]
    public Employee? Employee { get; set; }

    [Required]
    [StringLength(2000)]
    public string ReplyContent { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
