using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantAPI.Data;
using RestaurantAPI.Models;
using RestaurantAPI.Models.DTOs;

namespace RestaurantAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private const string PaidStatus = "Thành công";
    private const string CancelledStatus = "Đã hủy";
    private const string CompletedStatus = "Đã hoàn thành";
    private readonly AppDbContext _context;

    public ReportsController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>UC-40: View business dashboard.</summary>
    [HttpGet("dashboard")]
    public async Task<ActionResult<BusinessDashboardDto>> GetBusinessDashboard()
    {
        var today = DateTime.Today;
        var tomorrow = today.AddDays(1);
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var paidBills = from payment in _context.Payments.AsNoTracking()
                        where payment.Status == PaidStatus
                        join bill in _context.Bills.AsNoTracking() on payment.BillID equals bill.BillID
                        select bill;

        var todayBills = await paidBills
            .Where(bill => bill.CreatedAt >= today && bill.CreatedAt < tomorrow)
            .Select(bill => new { bill.FinalAmount, bill.CreatedAt, bill.OrderID })
            .ToListAsync();
        var monthBills = await paidBills
            .Where(bill => bill.CreatedAt >= monthStart && bill.CreatedAt < tomorrow)
            .Select(bill => bill.FinalAmount)
            .ToListAsync();
        var chartFrom = today.AddDays(-6);
        var chartBills = await paidBills
            .Where(bill => bill.CreatedAt >= chartFrom && bill.CreatedAt < tomorrow)
            .Select(bill => new { bill.FinalAmount, bill.CreatedAt, bill.OrderID })
            .ToListAsync();
        var reservationsToday = await _context.Reservations
            .CountAsync(reservation => reservation.ReservationTime >= today
                && reservation.ReservationTime < tomorrow
                && reservation.Status != CancelledStatus);
        var averageRating = await _context.Feedbacks
            .Where(feedback => !feedback.IsHidden)
            .Select(feedback => (double?)feedback.Rating)
            .AverageAsync() ?? 0;
        var totalTables = await _context.Tables.CountAsync();
        var activeTables = await _context.Tables.CountAsync(table =>
            table.Status == "Đã sử dụng" || table.Status == "Đang phục vụ" || table.Status == "Đã đặt");
        var orderCountsByDay = chartBills
            .GroupBy(bill => bill.CreatedAt.Date)
            .ToDictionary(group => group.Key, group => group.Select(bill => bill.OrderID).Distinct().Count());
        var revenueByDay = chartBills
            .GroupBy(bill => bill.CreatedAt.Date)
            .ToDictionary(group => group.Key, group => group.Sum(bill => bill.FinalAmount));

        return Ok(new BusinessDashboardDto
        {
            TodayRevenue = todayBills.Sum(bill => bill.FinalAmount),
            TodayOrders = todayBills.Select(bill => bill.OrderID).Distinct().Count(),
            TodayReservations = reservationsToday,
            AverageRating = Math.Round(averageRating, 2),
            ActiveTables = activeTables,
            TotalTables = totalTables,
            MonthRevenue = monthBills.Sum(),
            MonthOrders = await paidBills
                .Where(bill => bill.CreatedAt >= monthStart && bill.CreatedAt < tomorrow)
                .Select(bill => bill.OrderID)
                .Distinct()
                .CountAsync(),
            RevenueChart = Enumerable.Range(0, 7)
                .Select(offset =>
                {
                    var date = chartFrom.AddDays(offset);
                    return new RevenueByDayDto
                    {
                        Date = date.ToString("yyyy-MM-dd"),
                        Revenue = revenueByDay.GetValueOrDefault(date, 0),
                        OrderCount = orderCountsByDay.GetValueOrDefault(date, 0)
                    };
                })
                .ToList(),
            TopDishes = await GetBestSellingDishes(today, today)
        });
    }

    /// <summary>UC-41: View revenue report for an inclusive date range.</summary>
    [HttpGet("revenue")]
    public async Task<ActionResult<RevenueReportDto>> GetRevenueReport([FromQuery] ReportFilterDto filter)
    {
        if (!TryGetDateRange(filter, out var rangeStart, out var until, out var error))
            return BadRequest(new { message = error });

        var bills = await (from payment in _context.Payments.AsNoTracking()
                           where payment.Status == PaidStatus
                           join bill in _context.Bills.AsNoTracking() on payment.BillID equals bill.BillID
                           where bill.CreatedAt >= rangeStart && bill.CreatedAt < until
                           select new
                           {
                               bill.OrderID,
                               bill.CreatedAt,
                               bill.SubTotal,
                               bill.DiscountAmount,
                               bill.TaxAmount,
                               bill.FinalAmount
                           }).ToListAsync();
        var byDay = bills.GroupBy(bill => bill.CreatedAt.Date)
            .OrderBy(group => group.Key)
            .Select(group => new RevenueByDayDto
            {
                Date = group.Key.ToString("yyyy-MM-dd"),
                Revenue = group.Sum(bill => bill.FinalAmount),
                OrderCount = group.Select(bill => bill.OrderID).Distinct().Count()
            })
            .ToList();
        var promotionBills = await (from payment in _context.Payments.AsNoTracking()
                                    where payment.Status == PaidStatus
                                    join bill in _context.Bills.AsNoTracking() on payment.BillID equals bill.BillID
                                    join promotion in _context.Promotions.AsNoTracking()
                                        on bill.PromotionID equals promotion.PromotionID
                                    where bill.CreatedAt >= rangeStart && bill.CreatedAt < until
                                    group new { bill, promotion } by new
                                    {
                                        promotion.Code,
                                        promotion.PromotionName
                                    }
            into promotionGroup
                                    select new RevenueByPromotionDto
                                    {
                                        PromotionCode = promotionGroup.Key.Code,
                                        PromotionName = promotionGroup.Key.PromotionName,
                                        UsageCount = promotionGroup.Count(),
                                        TotalDiscount = promotionGroup.Sum(row => row.bill.DiscountAmount)
                                    }).ToListAsync();
        var subtotal = bills.Sum(bill => bill.SubTotal);
        var totalDiscount = bills.Sum(bill => bill.DiscountAmount);
        var totalTax = bills.Sum(bill => bill.TaxAmount);
        var finalRevenue = bills.Sum(bill => bill.FinalAmount);

        return Ok(new RevenueReportDto
        {
            TotalRevenue = subtotal,
            TotalDiscount = totalDiscount,
            TotalTax = totalTax,
            NetRevenue = finalRevenue,
            TotalOrders = bills.Select(bill => bill.OrderID).Distinct().Count(),
            AverageOrderValue = bills.Count == 0 ? 0 : decimal.Round(finalRevenue / bills.Count, 2),
            Details = byDay,
            ByPromotion = promotionBills
        });
    }

    /// <summary>UC-42: View best-selling dishes.</summary>
    [HttpGet("dishes/best-sellers")]
    public async Task<ActionResult<List<TopDishDto>>> GetBestSellers([FromQuery] ReportFilterDto filter)
    {
        if (!TryGetDateRange(filter, out var rangeStart, out var until, out var error))
            return BadRequest(new { message = error });

        return Ok(await GetBestSellingDishes(rangeStart, until.AddTicks(-1)));
    }

    /// <summary>UC-43: View worst-selling active dishes, including items with no sales.</summary>
    [HttpGet("dishes/worst-sellers")]
    public async Task<ActionResult<List<TopDishDto>>> GetWorstSellers([FromQuery] ReportFilterDto filter)
    {
        if (!TryGetDateRange(filter, out var rangeStart, out var until, out var error))
            return BadRequest(new { message = error });

        var sales = await GetDishSales(rangeStart, until);
        var salesByItem = sales.ToDictionary(item => item.MenuItemID);
        var items = await _context.MenuItems.AsNoTracking()
            .Where(item => item.IsActive)
            .Select(item => new TopDishDto
            {
                MenuItemID = item.MenuItemID,
                ItemName = item.ItemName,
                CategoryName = item.Category != null ? item.Category.CategoryName : null,
                ImageUrl = item.ImageUrl,
                Price = item.Price
            })
            .ToListAsync();

        foreach (var item in items)
        {
            if (!salesByItem.TryGetValue(item.MenuItemID, out var sold))
                continue;

            item.TotalQuantitySold = sold.TotalQuantitySold;
            item.TotalRevenue = sold.TotalRevenue;
            item.OrderCount = sold.OrderCount;
        }

        return Ok(items.OrderBy(item => item.TotalQuantitySold)
            .ThenBy(item => item.ItemName)
            .Take(10)
            .ToList());
    }

    /// <summary>UC-44: View order statistics.</summary>
    [HttpGet("orders")]
    public async Task<ActionResult<OrderStatisticsDto>> GetOrderStatistics([FromQuery] ReportFilterDto filter)
    {
        if (!TryGetDateRange(filter, out var rangeStart, out var until, out var error))
            return BadRequest(new { message = error });

        var orders = await _context.Orders.AsNoTracking()
            .Where(order => order.OrderTime >= rangeStart && order.OrderTime < until)
            .Select(order => new { order.OrderID, order.Status, order.OrderTime })
            .ToListAsync();
        var groupedStatuses = orders.GroupBy(order => order.Status)
            .Select(group => new OrderByStatusDto
            {
                Status = group.Key,
                Count = group.Count(),
                Percentage = orders.Count == 0 ? 0 : decimal.Round(group.Count() * 100m / orders.Count, 2)
            })
            .OrderByDescending(group => group.Count)
            .ToList();
        var completed = orders.Count(order => order.Status == CompletedStatus);
        var cancelled = orders.Count(order => order.Status == CancelledStatus);
        var paidAmounts = await (from bill in _context.Bills.AsNoTracking()
                                 join payment in _context.Payments.AsNoTracking()
                                     on bill.BillID equals payment.BillID
                                 where payment.Status == PaidStatus
                                     && bill.CreatedAt >= rangeStart && bill.CreatedAt < until
                                 select new { bill.OrderID, bill.FinalAmount })
            .ToListAsync();
        var orderCount = orders.Count;

        return Ok(new OrderStatisticsDto
        {
            TotalOrders = orderCount,
            CompletedOrders = completed,
            CancelledOrders = cancelled,
            PendingOrders = orderCount - completed - cancelled,
            CompletionRate = orderCount == 0 ? 0 : decimal.Round(completed * 100m / orderCount, 2),
            CancellationRate = orderCount == 0 ? 0 : decimal.Round(cancelled * 100m / orderCount, 2),
            AverageOrderValue = paidAmounts.Count == 0 ? 0 : decimal.Round(paidAmounts.Sum(bill => bill.FinalAmount) / paidAmounts.Count, 2),
            ByStatus = groupedStatuses,
            ByDay = orders.GroupBy(order => order.OrderTime.Date)
                .OrderBy(group => group.Key)
                .Select(group => new OrderByDayDto { Date = group.Key.ToString("yyyy-MM-dd"), Count = group.Count() })
                .ToList(),
            PeakHours = orders.GroupBy(order => order.OrderTime.Hour)
                .OrderByDescending(group => group.Count())
                .Select(group => new OrderByHourDto { Hour = group.Key, Count = group.Count() })
                .ToList()
        });
    }

    /// <summary>
    /// UC-45: View table usage. Usage rate represents the percentage of days
    /// with at least one non-cancelled order during the selected period.
    /// </summary>
    [HttpGet("tables")]
    public async Task<ActionResult<TableUsageStatisticsDto>> GetTableUsage([FromQuery] ReportFilterDto filter)
    {
        if (!TryGetDateRange(filter, out var rangeStart, out var until, out var error))
            return BadRequest(new { message = error });

        var days = (until - rangeStart).TotalDays;
        var orders = await _context.Orders.AsNoTracking()
            .Where(order => order.OrderTime >= rangeStart && order.OrderTime < until && order.Status != CancelledStatus)
            .Select(order => new { order.OrderID, order.OrderTime })
            .ToListAsync();
        var orderIds = orders.Select(order => order.OrderID).ToList();
        var orderTables = orderIds.Count == 0
            ? new List<TableOrderRow>()
            : await (from orderTable in _context.OrderTables.AsNoTracking()
                     where orderIds.Contains(orderTable.OrderID)
                     join table in _context.Tables.AsNoTracking() on orderTable.TableID equals table.TableID
                     join area in _context.Areas.AsNoTracking() on table.AreaID equals area.AreaID
                     select new TableOrderRow
                     {
                         TableID = table.TableID,
                         TableName = table.TableName,
                         Capacity = table.Capacity,
                         AreaID = area.AreaID,
                         AreaName = area.AreaName,
                         OrderID = orderTable.OrderID
                     }).ToListAsync();
        var paidRevenueByOrder = await (from bill in _context.Bills.AsNoTracking()
                                        join payment in _context.Payments.AsNoTracking()
                                            on bill.BillID equals payment.BillID
                                        where payment.Status == PaidStatus && orderIds.Contains(bill.OrderID)
                                        select new { bill.OrderID, bill.FinalAmount })
            .ToDictionaryAsync(row => row.OrderID, row => row.FinalAmount);
        var tables = await _context.Tables.AsNoTracking()
            .Select(table => new
            {
                table.TableID,
                table.TableName,
                table.Capacity,
                table.AreaID,
                AreaName = table.Area != null ? table.Area.AreaName : string.Empty
            })
            .ToListAsync();
        var usageRows = tables.Select(table =>
        {
            var usage = orderTables.Where(row => row.TableID == table.TableID).ToList();
            var usageCount = usage.Select(row => row.OrderID).Distinct().Count();
            var activeDays = usage
                .Join(orders, row => row.OrderID, order => order.OrderID, (row, order) => order.OrderTime.Date)
                .Distinct()
                .Count();
            var revenue = usage.Select(row => row.OrderID).Distinct()
                .Sum(orderId => paidRevenueByOrder.GetValueOrDefault(orderId, 0));
            return new TableUsageDto
            {
                TableID = table.TableID,
                TableName = table.TableName,
                AreaName = table.AreaName,
                Capacity = table.Capacity,
                TotalUsageTimes = usageCount,
                TotalRevenue = revenue,
                UsageRate = days == 0 ? 0 : Math.Round(activeDays * 100d / days, 2)
            };
        }).ToList();
        var byArea = tables.GroupBy(table => new { table.AreaID, table.AreaName })
            .Select(group =>
            {
                var areaTableIds = group.Select(table => table.TableID).ToHashSet();
                var areaUsage = usageRows.Where(table => areaTableIds.Contains(table.TableID)).ToList();
                return new AreaUsageDto
                {
                    AreaID = group.Key.AreaID,
                    AreaName = group.Key.AreaName,
                    TotalTables = group.Count(),
                    TotalUsageTimes = areaUsage.Sum(table => table.TotalUsageTimes),
                    TotalRevenue = areaUsage.Sum(table => table.TotalRevenue)
                };
            })
            .OrderBy(area => area.AreaName)
            .ToList();

        return Ok(new TableUsageStatisticsDto
        {
            TotalTables = tables.Count,
            AverageUsageRate = usageRows.Count == 0 ? 0 : Math.Round(usageRows.Average(table => table.UsageRate), 2),
            TableDetails = usageRows.OrderByDescending(table => table.TotalUsageTimes).ToList(),
            ByArea = byArea
        });
    }

    /// <summary>UC-46: View daily food quantity report.</summary>
    [HttpGet("daily-food-quantities")]
    public async Task<ActionResult<DailyFoodQuantityReportDto>> GetDailyFoodQuantities([FromQuery] DateTime? date)
    {
        var reportDate = (date ?? DateTime.Today).Date;
        var until = reportDate.AddDays(1);
        var soldItems = await (from detail in _context.OrderDetails.AsNoTracking()
                               join order in _context.Orders.AsNoTracking() on detail.OrderID equals order.OrderID
                               where detail.OrderTime >= reportDate && detail.OrderTime < until
                                   && order.Status != CancelledStatus && detail.Status != CancelledStatus
                               group detail by detail.MenuItemID into itemGroup
                               select new { MenuItemID = itemGroup.Key, Quantity = itemGroup.Sum(item => item.Quantity) })
            .ToListAsync();
        var inventory = await _context.DailyInventories.AsNoTracking()
            .Where(row => row.Date == reportDate)
            .ToDictionaryAsync(row => row.MenuItemID);
        var soldItemIds = soldItems.Select(sold => sold.MenuItemID).ToList();
        var items = await _context.MenuItems.AsNoTracking()
            .Where(item => item.IsActive || soldItemIds.Contains(item.MenuItemID))
            .Select(item => new
            {
                item.MenuItemID,
                item.ItemName,
                CategoryName = item.Category != null ? item.Category.CategoryName : null
            })
            .ToListAsync();
        var soldByItem = soldItems.ToDictionary(item => item.MenuItemID, item => item.Quantity);
        var rows = items.Select(item =>
        {
            inventory.TryGetValue(item.MenuItemID, out var stock);
            var sold = soldByItem.GetValueOrDefault(item.MenuItemID, 0);
            var initial = stock?.InitialQuantity ?? 0;
            var remaining = stock?.RemainingQuantity ?? 0;
            return new FoodQuantityDto
            {
                MenuItemID = item.MenuItemID,
                ItemName = item.ItemName,
                CategoryName = item.CategoryName,
                InitialQuantity = initial,
                SoldQuantity = sold,
                RemainingQuantity = remaining,
                SoldRate = initial == 0 ? 0 : decimal.Round(sold * 100m / initial, 2)
            };
        }).OrderByDescending(item => item.SoldQuantity).ThenBy(item => item.ItemName).ToList();

        return Ok(new DailyFoodQuantityReportDto { Date = reportDate, Items = rows });
    }

    /// <summary>UC-47: View service status report.</summary>
    [HttpGet("service-status")]
    public async Task<ActionResult<ServiceStatusReportDto>> GetServiceStatus([FromQuery] ReportFilterDto filter)
    {
        if (!TryGetDateRange(filter, out var rangeStart, out var until, out var error))
            return BadRequest(new { message = error });

        var details = await (from detail in _context.OrderDetails.AsNoTracking()
                             join order in _context.Orders.AsNoTracking() on detail.OrderID equals order.OrderID
                             join menuItem in _context.MenuItems.AsNoTracking() on detail.MenuItemID equals menuItem.MenuItemID
                             where order.OrderTime >= rangeStart && order.OrderTime < until
                                 && order.Status != CancelledStatus && detail.Status != CancelledStatus
                             select new ServiceStatusDetailDto
                             {
                                 OrderDetailID = detail.OrderDetailID,
                                 OrderTime = order.OrderTime,
                                 ItemName = menuItem.ItemName,
                                 Quantity = detail.Quantity,
                                 Status = detail.Status,
                                 Note = detail.Note
                             }).OrderByDescending(item => item.OrderTime).ToListAsync();

        return Ok(new ServiceStatusReportDto
        {
            FromDate = rangeStart,
            ToDate = until.AddTicks(-1),
            Details = details,
            StatusSummary = details.GroupBy(item => item.Status)
                .ToDictionary(group => group.Key, group => group.Count())
        });
    }

    /// <summary>UC-48: View employee performance report.</summary>
    [HttpGet("employee-performance")]
    public async Task<ActionResult<EmployeePerformanceReportDto>> GetEmployeePerformance([FromQuery] ReportFilterDto filter)
    {
        if (!TryGetDateRange(filter, out var rangeStart, out var until, out var error))
            return BadRequest(new { message = error });

        var employees = await _context.Employees.AsNoTracking()
            .Select(employee => new
            {
                employee.EmployeeID,
                employee.FullName,
                RoleName = employee.Role != null ? employee.Role.RoleName : null,
                DepartmentName = employee.Department != null ? employee.Department.DepartmentName : null
            })
            .ToListAsync();
        var orders = await _context.Orders.AsNoTracking()
            .Where(order => order.OrderTime >= rangeStart && order.OrderTime < until)
            .Select(order => new { order.OrderID, order.EmployeeID, order.Status })
            .ToListAsync();
        var paidRevenue = await (from bill in _context.Bills.AsNoTracking()
                                 join payment in _context.Payments.AsNoTracking()
                                     on bill.BillID equals payment.BillID
                                 join order in _context.Orders.AsNoTracking() on bill.OrderID equals order.OrderID
                                 where payment.Status == PaidStatus && bill.CreatedAt >= rangeStart && bill.CreatedAt < until
                                 select new { order.EmployeeID, bill.FinalAmount })
            .ToListAsync();
        var shiftCounts = await _context.Assignments.AsNoTracking()
            .Where(assignment => assignment.ShiftDate >= rangeStart.Date && assignment.ShiftDate < until)
            .GroupBy(assignment => assignment.EmployeeID)
            .Select(group => new { EmployeeID = group.Key, Count = group.Count() })
            .ToDictionaryAsync(row => row.EmployeeID, row => row.Count);

        var result = employees.Select(employee =>
        {
            var employeeOrders = orders.Where(order => order.EmployeeID == employee.EmployeeID).ToList();
            return new EmployeePerformanceDto
            {
                EmployeeID = employee.EmployeeID,
                FullName = employee.FullName,
                RoleName = employee.RoleName,
                DepartmentName = employee.DepartmentName,
                TotalOrders = employeeOrders.Count,
                CompletedOrders = employeeOrders.Count(order => order.Status == CompletedStatus),
                CancelledOrders = employeeOrders.Count(order => order.Status == CancelledStatus),
                TotalRevenue = paidRevenue.Where(row => row.EmployeeID == employee.EmployeeID).Sum(row => row.FinalAmount),
                ShiftsWorked = shiftCounts.GetValueOrDefault(employee.EmployeeID, 0)
            };
        }).OrderByDescending(employee => employee.TotalOrders).ThenBy(employee => employee.FullName).ToList();

        return Ok(new EmployeePerformanceReportDto { FromDate = rangeStart, ToDate = until.AddTicks(-1), Employees = result });
    }

    /// <summary>UC-49: View promotion effectiveness report.</summary>
    [HttpGet("promotion-effectiveness")]
    public async Task<ActionResult<PromotionEffectivenessReportDto>> GetPromotionEffectiveness([FromQuery] ReportFilterDto filter)
    {
        if (!TryGetDateRange(filter, out var rangeStart, out var until, out var error))
            return BadRequest(new { message = error });

        var promotions = await _context.Promotions.AsNoTracking()
            .Select(promotion => new
            {
                promotion.PromotionID,
                promotion.Code,
                promotion.PromotionName,
                promotion.DiscountType,
                promotion.DiscountValue
            })
            .ToListAsync();
        var paidBills = await (from payment in _context.Payments.AsNoTracking()
                               where payment.Status == PaidStatus
                               join bill in _context.Bills.AsNoTracking() on payment.BillID equals bill.BillID
                               where bill.CreatedAt >= rangeStart && bill.CreatedAt < until && bill.PromotionID.HasValue
                               select new
                               {
                                   PromotionID = bill.PromotionID!.Value,
                                   bill.DiscountAmount,
                                   bill.FinalAmount
                               }).ToListAsync();
        var report = promotions.Select(promotion =>
        {
            var usage = paidBills.Where(bill => bill.PromotionID == promotion.PromotionID).ToList();
            return new PromotionEffectivenessDto
            {
                PromotionID = promotion.PromotionID,
                Code = promotion.Code,
                PromotionName = promotion.PromotionName,
                DiscountType = promotion.DiscountType,
                DiscountValue = promotion.DiscountValue,
                UsageCount = usage.Count,
                TotalDiscountGiven = usage.Sum(bill => bill.DiscountAmount),
                TotalRevenueGenerated = usage.Sum(bill => bill.FinalAmount),
                AverageOrderValue = usage.Count == 0 ? 0 : decimal.Round(usage.Sum(bill => bill.FinalAmount) / usage.Count, 2)
            };
        }).OrderByDescending(promotion => promotion.UsageCount).ThenBy(promotion => promotion.Code).ToList();

        return Ok(new PromotionEffectivenessReportDto { FromDate = rangeStart, ToDate = until.AddTicks(-1), Promotions = report });
    }

    /// <summary>UC-50: Export a report as UTF-8 CSV.</summary>
    [HttpPost("export")]
    public async Task<IActionResult> ExportReport([FromBody] ExportRequestDto request)
    {
        if (!TryGetDateRange(request.FromDate, request.ToDate, out var rangeStart, out var until, out var error))
            return BadRequest(new { message = error });
        if (!string.Equals(request.Format, "csv", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Chỉ hỗ trợ xuất báo cáo định dạng CSV." });

        var requestedType = request.ReportType?.Trim().ToLowerInvariant() ?? string.Empty;
        var reportType = requestedType switch
        {
            "staff" => "employees",
            "promo" => "promotions",
            _ => requestedType
        };
        var rows = await GetExportRows(reportType, rangeStart, until);
        if (rows == null)
            return BadRequest(new { message = "Loại báo cáo không được hỗ trợ." });

        var csv = string.Join("\r\n", rows.Select(row => string.Join(",", row.Select(EscapeCsv))));
        var content = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(csv)).ToArray();
        var filename = $"lumiere-{reportType}-{rangeStart:yyyyMMdd}-{until.AddDays(-1):yyyyMMdd}.csv";
        return File(content, "text/csv; charset=utf-8", filename);
    }

    private async Task<List<TopDishDto>> GetBestSellingDishes(DateTime rangeStart, DateTime toInclusive)
    {
        var until = toInclusive.Date.AddDays(1);
        var sales = await GetDishSales(rangeStart.Date, until);
        return sales.OrderByDescending(item => item.TotalQuantitySold)
            .ThenBy(item => item.ItemName)
            .Take(10)
            .ToList();
    }

    private Task<List<TopDishDto>> GetDishSales(DateTime rangeStart, DateTime until)
    {
        return (from detail in _context.OrderDetails.AsNoTracking()
                join order in _context.Orders.AsNoTracking() on detail.OrderID equals order.OrderID
                join item in _context.MenuItems.AsNoTracking() on detail.MenuItemID equals item.MenuItemID
                where detail.OrderTime >= rangeStart && detail.OrderTime < until
                    && order.Status != CancelledStatus && detail.Status != CancelledStatus
                group new { detail, order } by new
                {
                    item.MenuItemID,
                    item.ItemName,
                    CategoryName = item.Category != null ? item.Category.CategoryName : null,
                    item.ImageUrl,
                    item.Price
                }
            into itemGroup
                select new TopDishDto
                {
                    MenuItemID = itemGroup.Key.MenuItemID,
                    ItemName = itemGroup.Key.ItemName,
                    CategoryName = itemGroup.Key.CategoryName,
                    ImageUrl = itemGroup.Key.ImageUrl,
                    Price = itemGroup.Key.Price,
                    TotalQuantitySold = itemGroup.Sum(row => row.detail.Quantity),
                    TotalRevenue = itemGroup.Sum(row => row.detail.UnitPrice * row.detail.Quantity),
                    OrderCount = itemGroup.Select(row => row.order.OrderID).Distinct().Count()
                }).ToListAsync();
    }

    private async Task<List<string[]>?> GetExportRows(string reportType, DateTime rangeStart, DateTime until)
    {
        switch (reportType)
        {
            case "revenue":
            {
                var result = RequireReport(await GetRevenueReport(new ReportFilterDto { FromDate = rangeStart, ToDate = until.AddTicks(-1) }));
                var rows = new List<string[]> { new[] { "Date", "Revenue", "Order count" } };
                rows.AddRange(result.Details.Select(row => new[] { row.Date, row.Revenue.ToString(), row.OrderCount.ToString() }));
                rows.Add(new[] { "TOTAL", result.NetRevenue.ToString(), result.TotalOrders.ToString() });
                return rows;
            }
            case "dishes":
            {
                var best = await GetBestSellingDishes(rangeStart, until.AddTicks(-1));
                var worst = RequireReport(await GetWorstSellers(new ReportFilterDto { FromDate = rangeStart, ToDate = until.AddTicks(-1) }));
                var rows = new List<string[]> { new[] { "Ranking", "Dish", "Quantity sold", "Revenue" } };
                rows.AddRange(best.Select(item => new[] { "Best", item.ItemName, item.TotalQuantitySold.ToString(), item.TotalRevenue.ToString() }));
                rows.AddRange(worst.Select(item => new[] { "Worst", item.ItemName, item.TotalQuantitySold.ToString(), item.TotalRevenue.ToString() }));
                return rows;
            }
            case "orders":
            {
                var report = RequireReport(await GetOrderStatistics(new ReportFilterDto { FromDate = rangeStart, ToDate = until.AddTicks(-1) }));
                var rows = new List<string[]> { new[] { "Status", "Count", "Percentage" } };
                rows.AddRange(report.ByStatus.Select(row => new[] { row.Status, row.Count.ToString(), row.Percentage.ToString() }));
                return rows;
            }
            case "tables":
            {
                var report = RequireReport(await GetTableUsage(new ReportFilterDto { FromDate = rangeStart, ToDate = until.AddTicks(-1) }));
                var rows = new List<string[]> { new[] { "Area", "Tables", "Usage count", "Revenue" } };
                rows.AddRange(report.ByArea.Select(row => new[] { row.AreaName, row.TotalTables.ToString(), row.TotalUsageTimes.ToString(), row.TotalRevenue.ToString() }));
                return rows;
            }
            case "quantities":
            {
                var sales = await (from detail in _context.OrderDetails.AsNoTracking()
                                   join order in _context.Orders.AsNoTracking() on detail.OrderID equals order.OrderID
                                   join item in _context.MenuItems.AsNoTracking() on detail.MenuItemID equals item.MenuItemID
                                   where detail.OrderTime >= rangeStart && detail.OrderTime < until
                                       && order.Status != CancelledStatus && detail.Status != CancelledStatus
                                   select new { detail.OrderTime, item.ItemName, detail.Quantity })
                    .ToListAsync();
                var rows = new List<string[]> { new[] { "Date", "Dish", "Sold quantity" } };
                rows.AddRange(sales.GroupBy(row => new { Date = row.OrderTime.Date, row.ItemName })
                    .OrderBy(group => group.Key.Date)
                    .ThenBy(group => group.Key.ItemName)
                    .Select(group => new[]
                    {
                        group.Key.Date.ToString("yyyy-MM-dd"),
                        group.Key.ItemName,
                        group.Sum(row => row.Quantity).ToString()
                    }));
                return rows;
            }
            case "service":
            {
                var report = RequireReport(await GetServiceStatus(new ReportFilterDto { FromDate = rangeStart, ToDate = until.AddTicks(-1) }));
                var rows = new List<string[]> { new[] { "Order time", "Dish", "Quantity", "Status", "Note" } };
                rows.AddRange(report.Details.Select(row => new[] { row.OrderTime.ToString("yyyy-MM-dd HH:mm:ss"), row.ItemName, row.Quantity.ToString(), row.Status, row.Note ?? string.Empty }));
                return rows;
            }
            case "employees":
            {
                var report = RequireReport(await GetEmployeePerformance(new ReportFilterDto { FromDate = rangeStart, ToDate = until.AddTicks(-1) }));
                var rows = new List<string[]> { new[] { "Employee", "Role", "Orders", "Completed", "Cancelled", "Revenue", "Shifts" } };
                rows.AddRange(report.Employees.Select(row => new[] { row.FullName, row.RoleName ?? string.Empty, row.TotalOrders.ToString(), row.CompletedOrders.ToString(), row.CancelledOrders.ToString(), row.TotalRevenue.ToString(), row.ShiftsWorked.ToString() }));
                return rows;
            }
            case "promotions":
            {
                var report = RequireReport(await GetPromotionEffectiveness(new ReportFilterDto { FromDate = rangeStart, ToDate = until.AddTicks(-1) }));
                var rows = new List<string[]> { new[] { "Code", "Promotion", "Usage count", "Discount given", "Revenue generated" } };
                rows.AddRange(report.Promotions.Select(row => new[] { row.Code, row.PromotionName ?? string.Empty, row.UsageCount.ToString(), row.TotalDiscountGiven.ToString(), row.TotalRevenueGenerated.ToString() }));
                return rows;
            }
            default:
                return null;
        }
    }

    private static string EscapeCsv(string value)
    {
        return $"\"{value.Replace("\"", "\"\"")}\"";
    }

    private static T RequireReport<T>(ActionResult<T> actionResult) where T : class
    {
        if (actionResult.Value is T value)
            return value;
        if (actionResult.Result is ObjectResult { Value: T resultValue })
            return resultValue;
        throw new InvalidOperationException($"Could not create the {typeof(T).Name} export data.");
    }

    private static bool TryGetDateRange(ReportFilterDto filter, out DateTime rangeStart, out DateTime until, out string error)
    {
        return TryGetDateRange(filter.FromDate, filter.ToDate, out rangeStart, out until, out error);
    }

    private static bool TryGetDateRange(DateTime fromDate, DateTime toDate, out DateTime rangeStart, out DateTime until, out string error)
    {
        rangeStart = fromDate.Date;
        until = toDate.Date.AddDays(1);
        error = string.Empty;
        if (rangeStart > toDate.Date)
        {
            error = "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.";
            return false;
        }
        if ((toDate.Date - rangeStart).TotalDays > 366)
        {
            error = "Khoảng thời gian báo cáo không được vượt quá 367 ngày.";
            return false;
        }
        return true;
    }

    private sealed class TableOrderRow
    {
        public int TableID { get; init; }
        public string TableName { get; init; } = string.Empty;
        public int Capacity { get; init; }
        public int AreaID { get; init; }
        public string AreaName { get; init; } = string.Empty;
        public int OrderID { get; init; }
    }
}
