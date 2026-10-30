using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantAPI.Models;

[Table("News")]
public class News
{
    [Key]
    public int NewsID { get; set; }

    [Required]
    [StringLength(300)]
    public string Title { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Summary { get; set; }

    public string? Content { get; set; }

    [StringLength(500)]
    public string? ThumbnailUrl { get; set; }

    [StringLength(100)]
    public string? Category { get; set; }

    [StringLength(100)]
    public string? Author { get; set; }

    public bool IsPublished { get; set; } = false;

    public bool IsFeatured { get; set; } = false;

    public int ViewCount { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime? UpdatedAt { get; set; }

    public DateTime? PublishedAt { get; set; }
}
