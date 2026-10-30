using System.ComponentModel.DataAnnotations;

namespace backend.Models.DTOs;

public sealed class CreateOrderRequest
{
    [Range(1, int.MaxValue)]
    public int EmployeeID { get; set; }

    public List<int> TableIDs { get; set; } = new();

    [MinLength(1)]
    public List<CreateOrderDetailRequest> Items { get; set; } = new();
}

public sealed class CreateOrderDetailRequest
{
    [Range(1, int.MaxValue)]
    public int MenuItemID { get; set; }

    [Range(1, 1000)]
    public int Quantity { get; set; }

    [StringLength(255)]
    public string? Note { get; set; }
}

public sealed class UpdateOrderStatusRequest
{
    [Required]
    public string Status { get; set; } = string.Empty;
}

public sealed class OrderListDto
{
    public int OrderID { get; set; }

    public int EmployeeID { get; set; }

    public DateTime OrderTime { get; set; }

    public string Status { get; set; } = string.Empty;

    public List<int> TableIDs { get; set; } = new();

    public List<OrderDetailDto> Items { get; set; } = new();

    public decimal Total { get; set; }
}

public sealed class OrderDetailDto
{
    public int OrderDetailID { get; set; }

    public int MenuItemID { get; set; }

    public string ItemName { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public string? Note { get; set; }

    public string Status { get; set; } = string.Empty;
}