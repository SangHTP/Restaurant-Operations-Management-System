using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs
{
    public class CreateTableDto
    {
        [Required(ErrorMessage = "Please select an area.")]
        public int AreaID { get; set; }

        [Required(ErrorMessage = "Table name cannot be empty.")]
        [StringLength(50, MinimumLength = 1, ErrorMessage = "Table name must be between 1 and 50 characters.")]
        public string TableName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Capacity cannot be empty.")]
        [Range(1, 100, ErrorMessage = "Capacity must be between 1 and 100.")]
        public int Capacity { get; set; }

        [StringLength(50)]
        public string? Status { get; set; } = "Available";
    }

    public class UpdateTableDto
    {
        [Required(ErrorMessage = "Please select an area.")]
        public int AreaID { get; set; }

        [Required(ErrorMessage = "Table name cannot be empty.")]
        [StringLength(50, MinimumLength = 1, ErrorMessage = "Table name must be between 1 and 50 characters.")]
        public string TableName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Capacity cannot be empty.")]
        [Range(1, 100, ErrorMessage = "Capacity must be between 1 and 100.")]
        public int Capacity { get; set; }

        [Required(ErrorMessage = "Table status cannot be empty.")]
        [StringLength(50)]
        public string Status { get; set; } = "Available";
    }
}
