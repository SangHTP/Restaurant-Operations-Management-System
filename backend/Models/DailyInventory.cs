using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{

    [Table("DailyInventories")]
    public class DailyInventory
    {
        [Key]
        public int InventoryID { get; set; }

        public int MenuItemID { get; set; }

        public DateTime Date { get; set; }

        public int InitialQuantity { get; set; }

        public int RemainingQuantity { get; set; }
    }
}