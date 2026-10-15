using backend.database;
using backend.Models;
using backend.Models.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PromotionController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PromotionController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Promotion
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] bool? isActive)
        {
            var query = _context.Promotions.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(p => p.Code.Contains(search) || (p.PromotionName != null && p.PromotionName.Contains(search)));
            }

            if (isActive.HasValue)
            {
                query = query.Where(p => p.IsActive == isActive.Value);
            }

            var promotions = await query.OrderByDescending(p => p.PromotionID).ToListAsync();
            return Ok(promotions);
        }

        // GET: api/Promotion/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var promotion = await _context.Promotions.FindAsync(id);
            if (promotion == null) return NotFound(new { message = "Không tìm thấy khuyến mãi!" });

            return Ok(promotion);
        }

        // 1. POST: api/Promotion 
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreatePromotionDto dto)
        {
            var now = DateTime.Now;

            if (dto.EndDate <= dto.StartDate)
            {
                return BadRequest(new { message = "Ngày kết thúc phải lớn hơn ngày bắt đầu!" });
            }

            if (dto.IsActive)
            {
                if (now.Date < dto.StartDate.Date)
                {
                    return BadRequest(new { message = "Ngày bắt đầu chưa tới, không thể mở (kích hoạt) khuyến mãi này!" });
                }
                if (now > dto.EndDate)
                {
                    return BadRequest(new { message = "Khuyến mãi đã quá ngày kết thúc, không thể mở (kích hoạt)!" });
                }
            }

            if (dto.DiscountType == "Percent" && (dto.DiscountValue <= 0 || dto.DiscountValue > 100))
            {
                return BadRequest(new { message = "Loại % giảm giá chỉ nhận giá trị từ 1 đến 100!" });
            }

            var exists = await _context.Promotions.AnyAsync(p => p.Code.ToUpper() == dto.Code.Trim().ToUpper());
            if (exists)
            {
                return BadRequest(new { message = "Mã khuyến mãi này đã tồn tại!" });
            }

            var promo = new Promotion
            {
                Code = dto.Code.Trim().ToUpper(),
                PromotionName = dto.PromotionName,
                DiscountType = dto.DiscountType,
                DiscountValue = dto.DiscountValue,
                MinOrderValue = dto.MinOrderValue,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                IsActive = dto.IsActive
            };

            _context.Promotions.Add(promo);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = promo.PromotionID }, promo);
        }

        // 2. PUT: api/Promotion/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdatePromotionDto dto)
        {
            var promo = await _context.Promotions.FindAsync(id);
            if (promo == null) return NotFound(new { message = "Không tìm thấy khuyến mãi!" });

            var now = DateTime.Now;

            if (dto.EndDate <= dto.StartDate)
            {
                return BadRequest(new { message = "Ngày kết thúc phải lớn hơn ngày bắt đầu!" });
            }

            if (dto.IsActive)
            {
                if (now.Date < dto.StartDate.Date)
                {
                    return BadRequest(new { message = "Ngày bắt đầu chưa tới, không thể mở khuyến mãi này!" });
                }
                if (now > dto.EndDate)
                {
                    return BadRequest(new { message = "Đã qua ngày kết thúc, không thể mở khuyến mãi này!" });
                }
            }

            if (dto.DiscountType == "Percent" && (dto.DiscountValue <= 0 || dto.DiscountValue > 100))
            {
                return BadRequest(new { message = "Loại % giảm giá chỉ nhận giá trị từ 1 đến 100!" });
            }

            var exists = await _context.Promotions.AnyAsync(p => p.PromotionID != id && p.Code.ToUpper() == dto.Code.Trim().ToUpper());
            if (exists)
            {
                return BadRequest(new { message = "Mã khuyến mãi này đã được dùng bởi một chương trình khác!" });
            }

            promo.Code = dto.Code.Trim().ToUpper();
            promo.PromotionName = dto.PromotionName;
            promo.DiscountType = dto.DiscountType;
            promo.DiscountValue = dto.DiscountValue;
            promo.MinOrderValue = dto.MinOrderValue;
            promo.StartDate = dto.StartDate;
            promo.EndDate = dto.EndDate;
            promo.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thành công!", data = promo });
        }

        // 3. DELETE: api/Promotion/{id} 
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var promo = await _context.Promotions.FindAsync(id);
            if (promo == null) return NotFound(new { message = "Không tìm thấy khuyến mãi!" });

            if (promo.IsActive)
            {
                return BadRequest(new { message = "Khuyến mãi đang được mở (Active), không thể xóa! Vui lòng tắt trước khi xóa." });
            }

            _context.Promotions.Remove(promo);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa khuyến mãi thành công!" });
        }

        // POST: api/Promotion/check-apply 
        [HttpPost("check-apply")]
        public async Task<IActionResult> CheckAndApply([FromBody] CheckPromotionDto dto)
        {
            var now = DateTime.Now;
            var promo = await _context.Promotions
                .FirstOrDefaultAsync(p => p.Code.ToUpper() == dto.Code.Trim().ToUpper() && p.IsActive);

            if (promo == null)
            {
                return BadRequest(new { message = "Mã khuyến mãi không tồn tại hoặc đã bị vô hiệu hóa!" });
            }

            if (now < promo.StartDate)
            {
                return BadRequest(new { message = "Chương trình khuyến mãi chưa bắt đầu!" });
            }

            if (now > promo.EndDate)
            {
                return BadRequest(new { message = "Mã khuyến mãi đã hết hạn sử dụng!" });
            }

            if (dto.OrderAmount < promo.MinOrderValue)
            {
                return BadRequest(new { message = $"Đơn hàng chưa đạt giá trị tối thiểu ({promo.MinOrderValue:N0} đ) để áp dụng mã này!" });
            }

            decimal discountAmount = 0;
            if (promo.DiscountType == "Percent")
            {
                discountAmount = (dto.OrderAmount * promo.DiscountValue) / 100m;
            }
            else 
            {
                discountAmount = promo.DiscountValue;
            }

            if (discountAmount > dto.OrderAmount)
            {
                discountAmount = dto.OrderAmount;
            }

            return Ok(new
            {
                PromotionID = promo.PromotionID,
                Code = promo.Code,
                PromotionName = promo.PromotionName,
                DiscountType = promo.DiscountType,
                DiscountValue = promo.DiscountValue,
                DiscountAmount = discountAmount,
                FinalTotal = dto.OrderAmount - discountAmount
            });
        }
    }
}