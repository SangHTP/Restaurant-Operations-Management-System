using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    public class CreateAreaDto
    {
        [Required(ErrorMessage = "Area name cannot be empty.")]
        [StringLength(100, MinimumLength = 1, ErrorMessage = "Area name must be between 1 and 100 characters.")]
        public string AreaName { get; set; } = string.Empty;

        [StringLength(255, ErrorMessage = "Description cannot exceed 255 characters.")]
        public string? Description { get; set; }
    }

    public class UpdateAreaDto
    {
        [Required(ErrorMessage = "Area name cannot be empty.")]
        [StringLength(100, MinimumLength = 1, ErrorMessage = "Area name must be between 1 and 100 characters.")]
        public string AreaName { get; set; } = string.Empty;

        [StringLength(255, ErrorMessage = "Description cannot exceed 255 characters.")]
        public string? Description { get; set; }
    }
}
