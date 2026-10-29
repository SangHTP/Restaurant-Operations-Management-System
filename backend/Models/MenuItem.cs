
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    // Entity tối thiểu để kiểm tra món ăn đang tham chiếu
    // đến danh mục nào.
    [Table("MenuItems")]
    public class MenuItem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int MenuItemID { get; set; }

        public int CategoryID { get; set; }
        public bool IsActive { get; set; }
        public string ItemName { get; internal set; }
        public virtual Category? Category { get; set; }
        public string ImageUrl { get; internal set; }
        public decimal Price { get; internal set; }
    }
}
