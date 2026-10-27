using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("Areas")]
    public class Area
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int AreaID { get; set; }

        [Required(ErrorMessage = "Tên khu vực không được để trống.")]
        [StringLength(100, ErrorMessage = "Tên khu vực không được vượt quá 100 ký tự.")]
        public string AreaName { get; set; } = string.Empty;

        [StringLength(255, ErrorMessage = "Mô tả không được vượt quá 255 ký tự.")]
        public string? Description { get; set; }

        public bool IsDeleted { get; set; } = false;
    }
}
