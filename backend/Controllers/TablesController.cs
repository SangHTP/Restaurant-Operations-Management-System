using backend.database;
using backend.Models;
using backend.Models.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/tables")]
    public class TablesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TablesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/tables
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? areaId)
        {
            var query = _context.Tables
                .Include(t => t.Area)
                .AsNoTracking()
                .Where(t => !t.IsDeleted);

            if (areaId.HasValue)
            {
                query = query.Where(t => t.AreaID == areaId.Value);
            }

            var tables = await query
                .OrderBy(t => t.TableID)
                .ToListAsync();

            return Ok(tables);
        }

        // GET: api/tables/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var table = await _context.Tables
                .Include(t => t.Area)
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.TableID == id && !t.IsDeleted);

            if (table == null)
            {
                return NotFound(new { message = "Không tìm thấy bàn." });
            }

            return Ok(table);
        }

        // POST: api/tables
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTableDto dto)
        {
            // Validate Area exists and not deleted
            var areaExists = await _context.Areas.AnyAsync(a => a.AreaID == dto.AreaID && !a.IsDeleted);
            if (!areaExists)
            {
                return BadRequest(new { message = "Khu vực được chọn không tồn tại hoặc đã bị xóa." });
            }

            var tableName = dto.TableName?.Trim();
            if (string.IsNullOrWhiteSpace(tableName))
            {
                return BadRequest(new { message = "Tên bàn không được để trống." });
            }

            // Check duplicate table name in same area
            var isDuplicate = await _context.Tables
                .AnyAsync(t => t.AreaID == dto.AreaID && t.TableName.ToLower() == tableName.ToLower() && !t.IsDeleted);

            if (isDuplicate)
            {
                return Conflict(new { message = $"Bàn '{tableName}' đã tồn tại trong khu vực này." });
            }

            var table = new Table
            {
                AreaID = dto.AreaID,
                TableName = tableName,
                Capacity = dto.Capacity,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Available" : dto.Status.Trim(),
                IsDeleted = false
            };

            _context.Tables.Add(table);
            await _context.SaveChangesAsync();

            return Ok(table);
        }

        // PUT: api/tables/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateTableDto dto)
        {
            var table = await _context.Tables.FirstOrDefaultAsync(t => t.TableID == id && !t.IsDeleted);
            if (table == null)
            {
                return NotFound(new { message = "Không tìm thấy bàn cần cập nhật." });
            }

            var areaExists = await _context.Areas.AnyAsync(a => a.AreaID == dto.AreaID && !a.IsDeleted);
            if (!areaExists)
            {
                return BadRequest(new { message = "Khu vực được chọn không tồn tại." });
            }

            var tableName = dto.TableName?.Trim();
            if (string.IsNullOrWhiteSpace(tableName))
            {
                return BadRequest(new { message = "Tên bàn không được để trống." });
            }

            var isDuplicate = await _context.Tables
                .AnyAsync(t => t.TableID != id && t.AreaID == dto.AreaID && t.TableName.ToLower() == tableName.ToLower() && !t.IsDeleted);

            if (isDuplicate)
            {
                return Conflict(new { message = $"Bàn '{tableName}' đã tồn tại trong khu vực này." });
            }

            table.AreaID = dto.AreaID;
            table.TableName = tableName;
            table.Capacity = dto.Capacity;
            table.Status = string.IsNullOrWhiteSpace(dto.Status) ? table.Status : dto.Status.Trim();

            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật bàn thành công.", data = table });
        }

        // DELETE: api/tables/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var table = await _context.Tables.FirstOrDefaultAsync(t => t.TableID == id && !t.IsDeleted);
            if (table == null)
            {
                return NotFound(new { message = "Không tìm thấy bàn cần xóa." });
            }

            bool hasOrderLinks = false;
            bool hasReservationLinks = false;

            try
            {
                hasOrderLinks = await _context.Database
                    .SqlQueryRaw<int>("SELECT COUNT(*) AS [Value] FROM [OrderTables] WHERE [TableID] = {0}", id)
                    .AnyAsync(count => count > 0);
            }
            catch { }

            try
            {
                hasReservationLinks = await _context.Database
                    .SqlQueryRaw<int>("SELECT COUNT(*) AS [Value] FROM [Reservations] WHERE [TableID] = {0}", id)
                    .AnyAsync(count => count > 0);
            }
            catch { }

            if (hasOrderLinks || hasReservationLinks)
            {
                // Soft delete
                table.IsDeleted = true;
                await _context.SaveChangesAsync();
                return Ok(new { message = "Bàn đã có liên kết lịch sử. Đã thực hiện xóa mềm thành công.", softDeleted = true });
            }
            else
            {
                // Hard delete
                _context.Tables.Remove(table);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Đã xóa vĩnh viễn bàn thành công.", softDeleted = false });
            }
        }
    }
}
