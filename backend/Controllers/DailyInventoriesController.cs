
using backend.database;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/daily-inventories")]
    public class DailyInventoriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DailyInventoriesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: /api/daily-inventories?date=2026-10-29
        [HttpGet]
        public async Task<IActionResult> GetDailyInventories(
            [FromQuery] DateTime? date)
        {
            var selectedDate = (date ?? DateTime.Today).Date;

            var inventories = await _context.DailyInventories
                .AsNoTracking()
                .Where(x => x.Date == selectedDate)
                .Join(
                    _context.MenuItems.AsNoTracking(),
                    inventory => inventory.MenuItemID,
                    menuItem => menuItem.MenuItemID,
                    (inventory, menuItem) => new
                    {
                        inventory.InventoryID,
                        inventory.MenuItemID,
                        menuItem.ItemName,
                        inventory.Date,
                        inventory.InitialQuantity,
                        inventory.RemainingQuantity
                    })
                .OrderBy(x => x.ItemName)
                .ToListAsync();

            return Ok(inventories);
        }

        // POST: /api/daily-inventories
        [HttpPost]
        public async Task<IActionResult> CreateDailyInventory(
            [FromBody] DailyInventory request)
        {
            if (request.MenuItemID <= 0)
            {
                return BadRequest(new
                {
                    message = "MenuItemID must be greater than zero."
                });
            }

            if (request.InitialQuantity < 0 ||
                request.RemainingQuantity < 0)
            {
                return BadRequest(new
                {
                    message = "Quantities cannot be negative."
                });
            }

            if (request.RemainingQuantity > request.InitialQuantity)
            {
                return BadRequest(new
                {
                    message = "Remaining quantity cannot exceed initial quantity."
                });
            }

            var menuItemExists = await _context.MenuItems
                .AnyAsync(x => x.MenuItemID == request.MenuItemID);

            if (!menuItemExists)
            {
                return NotFound(new
                {
                    message = "Menu item not found."
                });
            }

            var selectedDate = request.Date.Date;

            var alreadyExists = await _context.DailyInventories
                .AnyAsync(x =>
                    x.MenuItemID == request.MenuItemID &&
                    x.Date == selectedDate);

            if (alreadyExists)
            {
                return Conflict(new
                {
                    message = "Daily inventory already exists for this menu item and date."
                });
            }

            var inventory = new DailyInventory
            {
                MenuItemID = request.MenuItemID,
                Date = selectedDate,
                InitialQuantity = request.InitialQuantity,
                RemainingQuantity = request.RemainingQuantity
            };

            _context.DailyInventories.Add(inventory);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return Conflict(new
                {
                    message = "Could not create inventory. Check whether a record already exists for this menu item and date."
                });
            }

            return CreatedAtAction(
                nameof(GetDailyInventories),
                new { date = selectedDate.ToString("yyyy-MM-dd") },
                inventory);
        }

        // PUT: /api/daily-inventories/1
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateDailyInventory(
            int id,
            [FromBody] DailyInventory request)
        {
            var inventory = await _context.DailyInventories
                .FirstOrDefaultAsync(x => x.InventoryID == id);

            if (inventory == null)
            {
                return NotFound(new
                {
                    message = "Daily inventory not found."
                });
            }

            if (request.InitialQuantity < 0 ||
                request.RemainingQuantity < 0)
            {
                return BadRequest(new
                {
                    message = "Quantities cannot be negative."
                });
            }

            if (request.RemainingQuantity > request.InitialQuantity)
            {
                return BadRequest(new
                {
                    message = "Remaining quantity cannot exceed initial quantity."
                });
            }

            // Keep the menu item and date unchanged.
            inventory.InitialQuantity = request.InitialQuantity;
            inventory.RemainingQuantity = request.RemainingQuantity;

            await _context.SaveChangesAsync();

            return Ok(inventory);
        }
    }
}
