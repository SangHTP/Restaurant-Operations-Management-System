
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
    }
}
