
using backend.database;
using backend.Models;
using backend.Models.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/categories")]
    public class CategoriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CategoriesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/categories
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var categories = await _context.Categories
                .AsNoTracking()
                .OrderBy(c => c.CategoryName)
                .ToListAsync();

            return Ok(categories);
        }

        // GET: api/categories/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var category = await _context.Categories
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.CategoryID == id);

            if (category == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy danh mục món ăn."
                });
            }

            return Ok(category);
        }

        // POST: api/categories
        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] CreateCategoryDto dto)
        {
            var categoryName = dto.CategoryName?.Trim();

            if (string.IsNullOrWhiteSpace(categoryName))
            {
                return BadRequest(new
                {
                    message = "Tên danh mục không được để trống."
                });
            }

            if (categoryName.Length > 100)
            {
                return BadRequest(new
                {
                    message = "Tên danh mục không được vượt quá 100 ký tự."
                });
            }

            var normalizedName = categoryName.ToUpper();

            var exists = await _context.Categories
                .AnyAsync(c =>
                    c.CategoryName.ToUpper() == normalizedName);

            if (exists)
            {
                return Conflict(new
                {
                    message = "Tên danh mục đã tồn tại."
                });
            }

            var category = new Category
            {
                CategoryName = categoryName
            };

            _context.Categories.Add(category);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Xử lý trường hợp request đồng thời tạo tên trùng.
                return Conflict(new
                {
                    message = "Không thể tạo danh mục. Tên có thể đã tồn tại."
                });
            }

            return CreatedAtAction(
                nameof(GetById),
                new { id = category.CategoryID },
                category);
        }

        // PUT: api/categories/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] UpdateCategoryDto dto)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.CategoryID == id);

            if (category == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy danh mục món ăn."
                });
            }

            var categoryName = dto.CategoryName?.Trim();

            if (string.IsNullOrWhiteSpace(categoryName))
            {
                return BadRequest(new
                {
                    message = "Tên danh mục không được để trống."
                });
            }

            if (categoryName.Length > 100)
            {
                return BadRequest(new
                {
                    message = "Tên danh mục không được vượt quá 100 ký tự."
                });
            }

            var normalizedName = categoryName.ToUpper();

            var exists = await _context.Categories.AnyAsync(c =>
                c.CategoryID != id &&
                c.CategoryName.ToUpper() == normalizedName);

            if (exists)
            {
                return Conflict(new
                {
                    message =
                        "Tên danh mục đã được sử dụng bởi danh mục khác."
                });
            }

            category.CategoryName = categoryName;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return Conflict(new
                {
                    message =
                        "Không thể cập nhật danh mục. Tên có thể đã tồn tại."
                });
            }

            return Ok(new
            {
                message = "Cập nhật danh mục thành công.",
                data = category
            });
        }

        // DELETE: api/categories/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.CategoryID == id);

            if (category == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy danh mục món ăn."
                });
            }

            // Không xóa nếu danh mục vẫn được món ăn sử dụng.
            var hasMenuItems = await _context.MenuItems
                .AnyAsync(item => item.CategoryID == id);

            if (hasMenuItems)
            {
                return Conflict(new
                {
                    message =
                        "Không thể xóa danh mục vì vẫn còn món ăn thuộc " +
                        "danh mục này. Hãy chuyển các món ăn sang danh mục " +
                        "khác trước."
                });
            }

            _context.Categories.Remove(category);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Bảo vệ nếu có món ăn mới tham chiếu trong lúc xóa.
                return Conflict(new
                {
                    message =
                        "Không thể xóa danh mục vì đang được dữ liệu khác " +
                        "tham chiếu."
                });
            }

            return Ok(new
            {
                message = "Xóa danh mục thành công."
            });
        }
    }
}
