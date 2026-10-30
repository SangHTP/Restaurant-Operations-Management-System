using backend.database;
using backend.Models;
using backend.Models.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantAPI.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private static readonly string[] OrderStatuses =
    {
        "Pending",
        "Serving",
        "Completed",
        "Cancelled"
    };

    private readonly AppDbContext _db;

    public OrdersController(AppDbContext db)
    {
        _db = db;
    }

    // GET: api/orders
    // GET: api/orders?status=In%20Progress
    // GET: api/orders?date=2026-10-30
    [HttpGet]
    public async Task<ActionResult<IEnumerable<OrderListDto>>> GetOrders(
        [FromQuery] string? status,
        [FromQuery] DateTime? date)
    {
        var query = _db.Orders
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(o => o.Status == status);
        }

        if (date.HasValue)
        {
            var day = date.Value.Date;

            query = query.Where(o =>
                o.OrderTime >= day &&
                o.OrderTime < day.AddDays(1));
        }

        var orders = await query
            .OrderByDescending(o => o.OrderTime)
            .Select(o => new OrderListDto
            {
                OrderID = o.OrderID,
                EmployeeID = o.EmployeeID,
                OrderTime = o.OrderTime,
                Status = o.Status,

                TableIDs = o.OrderTables
                    .Select(t => t.TableID)
                    .ToList(),

                Items = o.OrderDetails
                    .Select(d => new OrderDetailDto
                    {
                        OrderDetailID = d.OrderDetailID,
                        MenuItemID = d.MenuItemID,

                        ItemName = d.MenuItem == null
                            ? ""
                            : d.MenuItem.ItemName,

                        Quantity = d.Quantity,
                        UnitPrice = d.UnitPrice,
                        Note = d.Note,
                        Status = d.Status
                    })
                    .ToList(),

                Total = o.OrderDetails
                    .Sum(d => d.Quantity * d.UnitPrice)
            })
            .ToListAsync();

        return Ok(orders);
    }

    // GET: api/orders/1
    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderListDto>> GetOrder(int id)
    {
        var order = await _db.Orders
            .AsNoTracking()
            .Where(o => o.OrderID == id)
            .Select(o => new OrderListDto
            {
                OrderID = o.OrderID,
                EmployeeID = o.EmployeeID,
                OrderTime = o.OrderTime,
                Status = o.Status,

                TableIDs = o.OrderTables
                    .Select(t => t.TableID)
                    .ToList(),

                Items = o.OrderDetails
                    .Select(d => new OrderDetailDto
                    {
                        OrderDetailID = d.OrderDetailID,
                        MenuItemID = d.MenuItemID,

                        ItemName = d.MenuItem == null
                            ? ""
                            : d.MenuItem.ItemName,

                        Quantity = d.Quantity,
                        UnitPrice = d.UnitPrice,
                        Note = d.Note,
                        Status = d.Status
                    })
                    .ToList(),

                Total = o.OrderDetails
                    .Sum(d => d.Quantity * d.UnitPrice)
            })
            .FirstOrDefaultAsync();

        if (order == null)
        {
            return NotFound(new
            {
                message = $"Order #{id} was not found."
            });
        }

        return Ok(order);
    }

    // POST: api/orders
    [HttpPost]
    public async Task<ActionResult<OrderListDto>> CreateOrder(
        CreateOrderRequest request)
    {
        if (request.Items == null || request.Items.Count == 0)
        {
            return BadRequest(new
            {
                message = "An order must contain at least one item."
            });
        }

        // Check whether the employee exists.
        var employeeExists = await _db.Database
            .SqlQuery<int>(
                $"SELECT COUNT(*) AS [Value] FROM Employees WHERE EmployeeID = {request.EmployeeID}")
            .SingleAsync() > 0;

        if (!employeeExists)
        {
            return BadRequest(new
            {
                message = "The specified EmployeeID does not exist."
            });
        }

        // Remove duplicate table IDs.
        var tableIds = request.TableIDs
            .Distinct()
            .ToList();

        // Check whether all specified tables exist.
        foreach (var tableId in tableIds)
        {
            var tableExists = await _db.Database
                .SqlQuery<int>(
                    $"SELECT COUNT(*) AS [Value] FROM Tables WHERE TableID = {tableId}")
                .SingleAsync() > 0;

            if (!tableExists)
            {
                return BadRequest(new
                {
                    message = $"TableID {tableId} does not exist."
                });
            }
        }

        // Retrieve active menu items.
        var itemIds = request.Items
            .Select(i => i.MenuItemID)
            .Distinct()
            .ToList();

        var menuItems = await _db.MenuItems
            .Where(m => itemIds.Contains(m.MenuItemID) && m.IsActive)
            .ToDictionaryAsync(m => m.MenuItemID);

        if (menuItems.Count != itemIds.Count)
        {
            return BadRequest(new
            {
                message = "One or more menu items do not exist or are inactive."
            });
        }

        await using var transaction =
            await _db.Database.BeginTransactionAsync();

        try
        {
            var now = DateTime.Now;

            var order = new Order
            {
                EmployeeID = request.EmployeeID,
                OrderTime = now,
                Status = "Serving",

                OrderTables = tableIds
                    .Select(id => new OrderTable
                    {
                        TableID = id
                    })
                    .ToList(),

                OrderDetails = request.Items
                    .Select(item => new OrderDetail
                    {
                        MenuItemID = item.MenuItemID,
                        Quantity = item.Quantity,

                        // Use the database price instead of trusting the frontend.
                        UnitPrice = menuItems[item.MenuItemID].Price,

                        Note = string.IsNullOrWhiteSpace(item.Note)
                            ? null
                            : item.Note.Trim(),

                        Status = "Chờ chế biến",
                        OrderTime = now
                    })
                    .ToList()
            };
            Console.WriteLine("========== CREATE ORDER DEBUG ==========");
            Console.WriteLine($"Status before save: [{order.Status}]");
            Console.WriteLine($"Database: {_db.Database.GetDbConnection().Database}");
            Console.WriteLine($"Server: {_db.Database.GetDbConnection().DataSource}");
            Console.WriteLine("========================================");
            _db.Orders.Add(order);

            // The SQL trigger may deduct inventory when order details are saved.
            await _db.SaveChangesAsync();

            await transaction.CommitAsync();

            return CreatedAtAction(
                nameof(GetOrder),
                new { id = order.OrderID },
                new
                {
                    order.OrderID,
                    order.EmployeeID,
                    order.OrderTime,
                    order.Status,
                    TableIDs = tableIds,
                    Total = order.OrderDetails.Sum(
                        d => d.Quantity * d.UnitPrice)
                });
        }
        catch (DbUpdateException ex)
        {
            await transaction.RollbackAsync();

            return Conflict(new
            {
                message = "Unable to create the order. Please check today's inventory and item quantities.",
                detail = ex.GetBaseException().Message
            });
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // PUT: api/orders/1
    // Body: { "status": "Pending Payment" }
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateOrderStatus(
        int id,
        UpdateOrderStatusRequest request)
    {
        if (!OrderStatuses.Contains(request.Status))
        {
            return BadRequest(new
            {
                message = "Invalid order status.",
                allowed = OrderStatuses
            });
        }

        var order = await _db.Orders.FindAsync(id);

        if (order == null)
        {
            return NotFound(new
            {
                message = $"Order #{id} was not found."
            });
        }

        // Update the status only.
        // Do not recreate order details because the trigger may deduct inventory again.
        order.Status = request.Status;

        await _db.SaveChangesAsync();

        return NoContent();
    }
}