using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Table("Tables")]
    public class Table
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int TableID { get; set; }

        [Required(ErrorMessage = "Vui lòng chọn khu vực.")]
        public int AreaID { get; set; }

        [Required(ErrorMessage = "Tên bàn không được để trống.")]
        [StringLength(50, ErrorMessage = "Tên bàn tối đa 50 ký tự.")]
        public string TableName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Sức chứa không được để trống.")]
        [Range(1, 100, ErrorMessage = "Sức chứa phải từ 1 đến 100 người.")]
        public int Capacity { get; set; }

        [Required(ErrorMessage = "Trạng thái bàn không được để trống.")]
        [StringLength(50)]
        public string Status { get; set; } = "Available";

        public bool IsDeleted { get; set; } = false;

        [ForeignKey("AreaID")]
        public virtual Area? Area { get; set; }
    }
}
