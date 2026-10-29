
namespace backend.Models.DTOs
{
    public class MenuItemListDto
    {
        public int MenuItemID { get; set; }

        public int CategoryID { get; set; }

        public string CategoryName { get; set; } = string.Empty;

        public string ItemName { get; set; } = string.Empty;

        public decimal Price { get; set; }

        public string? Description { get; set; }

        public string? ImageUrl { get; set; }

        public bool IsActive { get; set; }
    }
}
