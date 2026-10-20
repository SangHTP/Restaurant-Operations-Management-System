using backend.database;
using backend.Models;
using backend.Models.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/areas")]
    public class AreasController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AreasController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/areas
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var areas = await _context.Areas
                .AsNoTracking()
                .OrderBy(a => a.AreaID)
                .ToListAsync();

            return Ok(areas);
        }

        // GET: api/areas/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var area = await _context.Areas
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.AreaID == id);

            if (area == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy khu vực."
                });
            }

            return Ok(area);
        }

        // POST: api/areas
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateAreaDto dto)
        {
            var areaName = dto.AreaName?.Trim();

            if (string.IsNullOrWhiteSpace(areaName))
            {
                return BadRequest(new
                {
                    message = "Tên khu vực không được để trống."
                });
            }

            var isDuplicate = await _context.Areas
                .AnyAsync(a => a.AreaName.ToLower() == areaName.ToLower());

            if (isDuplicate)
            {
                return Conflict(new
                {
                    message = $"Khu vực '{areaName}' đã tồn tại."
                });
            }

            var area = new Area
            {
                AreaName = areaName,
                Description = dto.Description?.Trim()
            };

            _context.Areas.Add(area);
            await _context.SaveChangesAsync();

            return Ok(area);
        }

        // PUT: api/areas/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateAreaDto dto)
        {
            var area = await _context.Areas.FindAsync(id);

            if (area == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy khu vực cần cập nhật."
                });
            }

            var areaName = dto.AreaName?.Trim();

            if (string.IsNullOrWhiteSpace(areaName))
            {
                return BadRequest(new
                {
                    message = "Tên khu vực không được để trống."
                });
            }

            var isDuplicate = await _context.Areas
                .AnyAsync(a => a.AreaID != id && a.AreaName.ToLower() == areaName.ToLower());

            if (isDuplicate)
            {
                return Conflict(new
                {
                    message = $"Tên khu vực '{areaName}' đã được sử dụng."
                });
            }

            area.AreaName = areaName;
            area.Description = dto.Description?.Trim();

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật khu vực thành công.",
                data = area
            });
        }
    }
}
