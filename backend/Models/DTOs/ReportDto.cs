namespace RestaurantAPI.Models.DTOs;

// ===== REPORT DTOs (UC-40 to UC-50) =====

// UC-40: Business Dashboard
public class BusinessDashboardDto
{
    public decimal TodayRevenue { get; set; }
    public int TodayOrders { get; set; }
    public int TodayReservations { get; set; }
    public double AverageRating { get; set; }
    public int ActiveTables { get; set; }
    public int TotalTables { get; set; }
    public decimal MonthRevenue { get; set; }
    public int MonthOrders { get; set; }
    public List<RevenueByDayDto> RevenueChart { get; set; } = new();
    public List<TopDishDto> TopDishes { get; set; } = new();
}

public class RevenueByDayDto
{
    public string Date { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int OrderCount { get; set; }
}

// UC-41: Revenue Report
public class RevenueReportDto
{
    public decimal TotalRevenue { get; set; }
    public decimal TotalDiscount { get; set; }
    public decimal TotalTax { get; set; }
    public decimal NetRevenue { get; set; }
    public int TotalOrders { get; set; }
    public decimal AverageOrderValue { get; set; }
    public List<RevenueByDayDto> Details { get; set; } = new();
    public List<RevenueByPromotionDto> ByPromotion { get; set; } = new();
}

public class RevenueByPromotionDto
{
    public string? PromotionCode { get; set; }
    public string? PromotionName { get; set; }
    public int UsageCount { get; set; }
    public decimal TotalDiscount { get; set; }
}

// UC-42: Best-Selling Dishes
public class TopDishDto
{
    public int MenuItemID { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string? CategoryName { get; set; }
    public string? ImageUrl { get; set; }
    public decimal Price { get; set; }
    public int TotalQuantitySold { get; set; }
    public decimal TotalRevenue { get; set; }
    public int OrderCount { get; set; }
}

// UC-43: Worst-Selling Dishes - reuses TopDishDto

// UC-44: Order Statistics
public class OrderStatisticsDto
{
    public int TotalOrders { get; set; }
    public int CompletedOrders { get; set; }
    public int CancelledOrders { get; set; }
    public int PendingOrders { get; set; }
    public decimal CompletionRate { get; set; }
    public decimal CancellationRate { get; set; }
    public decimal AverageOrderValue { get; set; }
    public List<OrderByStatusDto> ByStatus { get; set; } = new();
    public List<OrderByDayDto> ByDay { get; set; } = new();
    public List<OrderByHourDto> PeakHours { get; set; } = new();
}

public class OrderByStatusDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

public class OrderByDayDto
{
    public string Date { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class OrderByHourDto
{
    public int Hour { get; set; }
    public int Count { get; set; }
}

// UC-45: Table Usage Statistics
public class TableUsageStatisticsDto
{
    public int TotalTables { get; set; }
    public double AverageUsageRate { get; set; }
    public List<TableUsageDto> TableDetails { get; set; } = new();
    public List<AreaUsageDto> ByArea { get; set; } = new();
}

public class TableUsageDto
{
    public int TableID { get; set; }
    public string TableName { get; set; } = string.Empty;
    public string? AreaName { get; set; }
    public int Capacity { get; set; }
    public int TotalUsageTimes { get; set; }
    public decimal TotalRevenue { get; set; }
    public double UsageRate { get; set; }
}

public class AreaUsageDto
{
    public int AreaID { get; set; }
    public string AreaName { get; set; } = string.Empty;
    public int TotalTables { get; set; }
    public int TotalUsageTimes { get; set; }
    public decimal TotalRevenue { get; set; }
}

// UC-46: Daily Food Quantity Report
public class DailyFoodQuantityReportDto
{
    public DateTime Date { get; set; }
    public List<FoodQuantityDto> Items { get; set; } = new();
}

public class FoodQuantityDto
{
    public int MenuItemID { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string? CategoryName { get; set; }
    public int InitialQuantity { get; set; }
    public int SoldQuantity { get; set; }
    public int RemainingQuantity { get; set; }
    public decimal SoldRate { get; set; }
}

// UC-47: Service Status Report
public class ServiceStatusReportDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public List<ServiceStatusDetailDto> Details { get; set; } = new();
    public Dictionary<string, int> StatusSummary { get; set; } = new();
}

public class ServiceStatusDetailDto
{
    public int OrderDetailID { get; set; }
    public DateTime OrderTime { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
}

// UC-48: Employee Performance Report
public class EmployeePerformanceReportDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public List<EmployeePerformanceDto> Employees { get; set; } = new();
}

public class EmployeePerformanceDto
{
    public int EmployeeID { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? RoleName { get; set; }
    public string? DepartmentName { get; set; }
    public int TotalOrders { get; set; }
    public int CompletedOrders { get; set; }
    public int CancelledOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public int ShiftsWorked { get; set; }
}

// UC-49: Promotion Effectiveness Report
public class PromotionEffectivenessReportDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public List<PromotionEffectivenessDto> Promotions { get; set; } = new();
}

public class PromotionEffectivenessDto
{
    public int PromotionID { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? PromotionName { get; set; }
    public string DiscountType { get; set; } = string.Empty;
    public decimal DiscountValue { get; set; }
    public int UsageCount { get; set; }
    public decimal TotalDiscountGiven { get; set; }
    public decimal TotalRevenueGenerated { get; set; }
    public decimal AverageOrderValue { get; set; }
}

// Common filter
public class ReportFilterDto
{
    public DateTime FromDate { get; set; } = DateTime.Today.AddDays(-30);
    public DateTime ToDate { get; set; } = DateTime.Today;
    public string? GroupBy { get; set; } = "day"; // day, week, month
}

public class ExportRequestDto
{
    public string ReportType { get; set; } = string.Empty; // revenue, orders, dishes, tables, employees, promotions
    public DateTime FromDate { get; set; } = DateTime.Today.AddDays(-30);
    public DateTime ToDate { get; set; } = DateTime.Today;
    public string Format { get; set; } = "csv";
}
