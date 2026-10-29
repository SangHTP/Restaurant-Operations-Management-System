
using backend.database;
using backend.Models;
using backend.Models.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/menu-items")]
    public class MenuItemsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MenuItemsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/menu-items
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MenuItemListDto>>> GetAll()
        {
            var menuItems = await (
                from item in _context.MenuItems.AsNoTracking()
                join category in _context.Categories.AsNoTracking()
                    on item.CategoryID equals category.CategoryID
                orderby item.ItemName
                select new MenuItemListDto
                {
                    MenuItemID = item.MenuItemID,
                    CategoryID = item.CategoryID,
                    CategoryName = category.CategoryName,
                    ItemName = item.ItemName,
                    Price = item.Price,
                    Description = item.Description,
                    ImageUrl = item.ImageUrl,
                    IsActive = item.IsActive
                }
            ).ToListAsync();

            return Ok(menuItems);
        }

        // GET: api/menu-items/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<MenuItemListDto>> GetById(int id)
        {
            var menuItem = await (
                from item in _context.MenuItems.AsNoTracking()
                join category in _context.Categories.AsNoTracking()
                    on item.CategoryID equals category.CategoryID
                where item.MenuItemID == id
                select new MenuItemListDto
                {
                    MenuItemID = item.MenuItemID,
                    CategoryID = item.CategoryID,
                    CategoryName = category.CategoryName,
                    ItemName = item.ItemName,
                    Price = item.Price,
                    Description = item.Description,
                    ImageUrl = item.ImageUrl,
                    IsActive = item.IsActive
                }
            ).FirstOrDefaultAsync();

            if (menuItem == null)
            {
                return NotFound(new { message = "Menu item not found." });
            }

            return Ok(menuItem);
        }

        // POST: api/menu-items
        [HttpPost]
        public async Task<ActionResult<MenuItemListDto>> Create(
            [FromBody] MenuItemCreateRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.ItemName))
            {
                return BadRequest(new { message = "Item name is required." });
            }

            if (request.ItemName.Trim().Length > 40)
            {
                return BadRequest(new { message = "Item name cannot exceed 40 characters." });
            }

            if (request.Price < 0)
            {
                return BadRequest(new { message = "Item price cannot be negative." });
            }

            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.CategoryID == request.CategoryID);

            if (category == null)
            {
                return BadRequest(new { message = "Category does not exist." });
            }

            var item = new MenuItem
            {
                CategoryID = request.CategoryID,
                ItemName = request.ItemName.Trim(),
                Price = request.Price,
                Description = request.Description?.Trim(),
                ImageUrl = request.ImageUrl?.Trim(),
                IsActive = request.IsActive
            };

            _context.MenuItems.Add(item);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new
                {
                    message = ex.GetBaseException().Message
                });
            }

            var result = new MenuItemListDto
            {
                MenuItemID = item.MenuItemID,
                CategoryID = item.CategoryID,
                CategoryName = category.CategoryName,
                ItemName = item.ItemName,
                Price = item.Price,
                Description = item.Description,
                ImageUrl = item.ImageUrl,
                IsActive = item.IsActive
            };

            return CreatedAtAction(
                nameof(GetById),
                new { id = item.MenuItemID },
                result);
        }

        // PUT: api/menu-items/5
        [HttpPut("{id:int}")]
        public async Task<ActionResult<MenuItemListDto>> Update(
            int id,
            [FromBody] MenuItemUpdateRequest request)
        {
            var item = await _context.MenuItems
                .FirstOrDefaultAsync(m => m.MenuItemID == id);

            if (item == null)
            {
                return NotFound(new { message = "Menu item not found." });
            }

            if (string.IsNullOrWhiteSpace(request.ItemName))
            {
                return BadRequest(new { message = "Item name is required." });
            }

            if (request.ItemName.Trim().Length > 40)
            {
                return BadRequest(new { message = "Item name cannot exceed 40 characters." });
            }

            if (request.Price < 0)
            {
                return BadRequest(new { message = "Item price cannot be negative." });
            }

            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.CategoryID == request.CategoryID);

            if (category == null)
            {
                return BadRequest(new { message = "Category does not exist." });
            }

            item.CategoryID = request.CategoryID;
            item.ItemName = request.ItemName.Trim();
            item.Price = request.Price;
            item.Description = request.Description?.Trim();
            item.ImageUrl = request.ImageUrl?.Trim();
            item.IsActive = request.IsActive;

            await _context.SaveChangesAsync();

            return Ok(new MenuItemListDto
            {
                MenuItemID = item.MenuItemID,
                CategoryID = item.CategoryID,
                CategoryName = category.CategoryName,
                ItemName = item.ItemName,
                Price = item.Price,
                Description = item.Description,
                ImageUrl = item.ImageUrl,
                IsActive = item.IsActive
            });
        }

        // PATCH: api/menu-items/5/status
        [HttpPatch("{id:int}/status")]
        public async Task<IActionResult> UpdateStatus(
            int id,
            [FromBody] MenuItemStatusRequest request)
        {
            var item = await _context.MenuItems
                .FirstOrDefaultAsync(m => m.MenuItemID == id);

            if (item == null)
            {
                return NotFound(new { message = "Menu item not found." });
            }

            item.IsActive = request.IsActive;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = request.IsActive
                    ? "Menu item activated successfully."
                    : "Menu item deactivated successfully.",
                menuItemID = item.MenuItemID,
                isActive = item.IsActive
            });
        }

        // DELETE: api/menu-items/5
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _context.MenuItems
                .FirstOrDefaultAsync(m => m.MenuItemID == id);

            if (item == null)
            {
                return NotFound(new { message = "Menu item not found." });
            }

            _context.MenuItems.Remove(item);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return Conflict(new
                {
                    message = "Cannot delete this menu item because other records reference it."
                });
            }

            return Ok(new { message = "Menu item deleted successfully." });
        }
    }

    public class MenuItemCreateRequest
    {
        public int CategoryID { get; set; }

        public string ItemName { get; set; } = string.Empty;

        public decimal Price { get; set; }

        public string? Description { get; set; }

        public string? ImageUrl { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class MenuItemUpdateRequest
    {
        public int CategoryID { get; set; }

        public string ItemName { get; set; } = string.Empty;

        public decimal Price { get; set; }

        public string? Description { get; set; }

        public string? ImageUrl { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class MenuItemStatusRequest
    {
        public bool IsActive { get; set; }
    }
}
