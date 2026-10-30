using backend.database;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantAPI.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BillController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BillController(AppDbContext context)
        {
            _context = context;
        }
        [HttpGet("pending-orders")]
        public async Task<IActionResult> GetPendingOrders()
        {
            var orders = await (from o in _context.Set<Order>()
                                where o.Status == "Chờ thanh toán" || o.Status == "Đang phục vụ"
                                join ot in _context.Set<OrderTable>() on o.OrderID equals ot.OrderID into ots
                                from ot in ots.DefaultIfEmpty()
                                join t in _context.Set<Table>() on ot.TableID equals t.TableID into ts
                                from t in ts.DefaultIfEmpty()
                                orderby o.OrderTime descending
                                select new
                                {
                                    o.OrderID,
                                    o.OrderTime,
                                    o.Status,
                                    TableName = t != null ? t.TableName : "Mang về / Bàn trống",
                                    Items = (from od in _context.Set<OrderDetail>()
                                             where od.OrderID == o.OrderID
                                             join m in _context.Set<MenuItem>() on od.MenuItemID equals m.MenuItemID
                                             select new
                                             {
                                                 m.ItemName,
                                                 od.Quantity,
                                                 od.UnitPrice,
                                                 Total = od.Quantity * od.UnitPrice
                                             }).ToList()
                                }).ToListAsync();

            var result = orders.Select(o => new
            {
                o.OrderID,
                o.OrderTime,
                o.Status,
                o.TableName,
                Items = o.Items,
                SubTotal = o.Items.Sum(i => i.Total)
            });

            return Ok(result);
        }
        [HttpGet]
        public async Task<IActionResult> GetAllBills()
        {
            var bills = await (from b in _context.Bills
                               join p in _context.Promotions on b.PromotionID equals p.PromotionID into ps
                               from p in ps.DefaultIfEmpty()
                               orderby b.CreatedAt descending
                               select new
                               {
                                   b.BillID,
                                   b.OrderID,
                                   b.SubTotal,
                                   b.DiscountAmount,
                                   b.TaxAmount,
                                   b.FinalAmount,
                                   b.CreatedAt,
                                   PromotionCode = p != null ? p.Code : null
                               }).ToListAsync();

            return Ok(bills);
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetBillDetail(int id)
        {
            var bill = await _context.Bills
                .Include(b => b.Promotion)
                .FirstOrDefaultAsync(b => b.BillID == id);

            if (bill == null) return NotFound(new { message = "Không tìm thấy hóa đơn!" });

            // 1. Lấy thông tin thanh toán từ bảng Payments
            var payment = await _context.Bills.FirstOrDefaultAsync(p => p.BillID == id);

            // 2. Lấy thông tin bàn qua OrderTables
            var tableName = await (from ot in _context.Set<OrderTable>()
                                   where ot.OrderID == bill.OrderID
                                   join t in _context.Set<Table>() on ot.TableID equals t.TableID
                                   select t.TableName).FirstOrDefaultAsync() ?? "Mang về / Bàn trống";

            // 3. Lấy tên nhân viên thu ngân
            var employee = await _context.Set<Employee>().FindAsync(bill.CreatedBy);
            string cashierName = employee != null ? employee.FullName : "Thu ngân quầy";

            // 4. Lấy danh sách từng món ăn của Order này
            var items = await (from od in _context.Set<OrderDetail>()
                               where od.OrderID == bill.OrderID
                               join m in _context.Set<MenuItem>() on od.MenuItemID equals m.MenuItemID
                               select new
                               {
                                   m.ItemName,
                                   od.Quantity,
                                   od.UnitPrice,
                                   Total = od.Quantity * od.UnitPrice
                               }).ToListAsync();

            return Ok(new
            {
                bill.BillID,
                InvoiceCode = $"HD-{bill.BillID:D4}",
                bill.OrderID,
                TableName = tableName,
                CashierName = cashierName,
                CreatedAt = bill.CreatedAt,
                bill.SubTotal,
                bill.DiscountAmount,
                bill.TaxAmount,
                bill.FinalAmount,
                Promotion = bill.Promotion != null ? new
                {
                    bill.Promotion.Code,
                    bill.Promotion.PromotionName,
                    bill.Promotion.DiscountType,
                    bill.Promotion.DiscountValue
                } : null,
                Items = items
            });
        }
        [HttpPost]
        public async Task<IActionResult> CreateBill([FromBody] CreateBillDto dto)
        {
            var billExists = await _context.Bills.AnyAsync(b => b.OrderID == dto.OrderID);
            if (billExists) return BadRequest(new { message = "Đơn hàng này đã được thanh toán!" });

            var items = await _context.Set<OrderDetail>().Where(od => od.OrderID == dto.OrderID).ToListAsync();
            if (!items.Any()) return BadRequest(new { message = "Đơn hàng không có món nào để thanh toán!" });

            decimal subTotal = items.Sum(i => i.Quantity * i.UnitPrice);
            decimal discountAmount = 0;
            Promotion? promo = null;

            if (!string.IsNullOrWhiteSpace(dto.PromotionCode))
            {
                var now = DateTime.Now;
                promo = await _context.Promotions.FirstOrDefaultAsync(p => p.Code.ToUpper() == dto.PromotionCode.Trim().ToUpper());

                if (promo == null || !promo.IsActive || promo.EndDate < now || promo.Count <= 0)
                {
                    return BadRequest(new { message = "Mã khuyến mãi không hợp lệ, đã hết hạn hoặc hết lượt!" });
                }

                if (subTotal < promo.MinOrderValue)
                {
                    return BadRequest(new { message = $"Đơn hàng chưa đạt giá trị tối thiểu {promo.MinOrderValue:N0} đ!" });
                }

                discountAmount = promo.DiscountType == "Percent"
                    ? (subTotal * promo.DiscountValue) / 100m
                    : promo.DiscountValue;

                if (discountAmount > subTotal) discountAmount = subTotal;

                promo.Count -= 1;
                if (promo.Count <= 0) promo.IsActive = false; 
            }

            decimal taxableAmount = subTotal - discountAmount;
            decimal taxAmount = Math.Round(taxableAmount * 0.08m, 0);
            decimal finalAmount = taxableAmount + taxAmount;

            var bill = new Bill
            {
                OrderID = dto.OrderID,
                PromotionID = promo?.PromotionID,
                SubTotal = subTotal,
                DiscountAmount = discountAmount,
                TaxAmount = taxAmount,
                FinalAmount = finalAmount,
                CreatedBy = dto.EmployeeID > 0 ? dto.EmployeeID : 1, 
                CreatedAt = DateTime.Now
            };

            _context.Bills.Add(bill);

            var order = await _context.Set<Order>().FindAsync(dto.OrderID);
            if (order != null)
            {
                order.Status = "Đã hoàn thành";
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Tạo hóa đơn thành công!", billID = bill.BillID });
        }
    }

    public class CreateBillDto
    {
        public int OrderID { get; set; }
        public string? PromotionCode { get; set; }
        public int EmployeeID { get; set; } = 1;
    }
}