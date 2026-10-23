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
                .Where(a => !a.IsDeleted)
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
                .FirstOrDefaultAsync(a => a.AreaID == id && !a.IsDeleted);

            if (area == null)
            {
                return NotFound(new { message = "Area not found." });
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
                return BadRequest(new { message = "Area name cannot be empty." });
            }

            var isDuplicate = await _context.Areas
                .AnyAsync(a => a.AreaName.ToLower() == areaName.ToLower() && !a.IsDeleted);

            if (isDuplicate)
            {
                return Conflict(new { message = $"Area '{areaName}' already exists." });
            }

            var area = new Area
            {
                AreaName = areaName,
                Description = dto.Description?.Trim(),
                IsDeleted = false
            };

            _context.Areas.Add(area);
            await _context.SaveChangesAsync();

            return Ok(area);
        }

        // PUT: api/areas/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateAreaDto dto)
        {
            var area = await _context.Areas.FirstOrDefaultAsync(a => a.AreaID == id && !a.IsDeleted);

            if (area == null)
            {
                return NotFound(new { message = "Area not found for update." });
            }

            var areaName = dto.AreaName?.Trim();

            if (string.IsNullOrWhiteSpace(areaName))
            {
                return BadRequest(new { message = "Area name cannot be empty." });
            }

            var isDuplicate = await _context.Areas
                .AnyAsync(a => a.AreaID != id && a.AreaName.ToLower() == areaName.ToLower() && !a.IsDeleted);

            if (isDuplicate)
            {
                return Conflict(new { message = $"Area name '{areaName}' is already in use." });
            }

            area.AreaName = areaName;
            area.Description = dto.Description?.Trim();

            await _context.SaveChangesAsync();

            return Ok(new { message = "Area updated successfully.", data = area });
        }

        // DELETE: api/areas/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var area = await _context.Areas.FirstOrDefaultAsync(a => a.AreaID == id && !a.IsDeleted);
            if (area == null)
            {
                return NotFound(new { message = "Area not found for deletion." });
            }

            // Check if any active tables belong to this area
            var activeTables = await _context.Tables
                .Where(t => t.AreaID == id && !t.IsDeleted)
                .ToListAsync();

            if (activeTables.Any())
            {
                // Soft delete area AND soft delete all tables belonging to this area
                area.IsDeleted = true;
                foreach (var table in activeTables)
                {
                    table.IsDeleted = true;
                }
                await _context.SaveChangesAsync();
                return Ok(new { message = "Area and its active tables have been soft deleted successfully.", softDeleted = true });
            }
            else
            {
                // Hard delete area if no active tables exist
                _context.Areas.Remove(area);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Area deleted permanently successfully.", softDeleted = false });
            }
        }
    }
}
