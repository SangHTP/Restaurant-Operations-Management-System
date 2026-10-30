using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantAPI.Data;
using RestaurantAPI.Models;
using RestaurantAPI.Models.DTOs;

namespace RestaurantAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BannerController : ControllerBase
{
    private readonly AppDbContext _context;

    public BannerController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>UC-29: View Banner List</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<BannerDto>>> GetBanners(
        [FromQuery] bool? isActive = null)
    {
        var query = _context.Banners.AsQueryable();

        if (isActive.HasValue)
            query = query.Where(b => b.IsActive == isActive.Value);

        var banners = await query
            .OrderBy(b => b.DisplayOrder)
            .ThenByDescending(b => b.CreatedAt)
            .Select(b => new BannerDto
            {
                BannerID = b.BannerID,
                Title = b.Title,
                Subtitle = b.Subtitle,
                ImageUrl = b.ImageUrl,
                LinkUrl = b.LinkUrl,
                DisplayOrder = b.DisplayOrder,
                IsActive = b.IsActive,
                CreatedAt = b.CreatedAt,
                UpdatedAt = b.UpdatedAt
            })
            .ToListAsync();

        return Ok(banners);
    }

    /// <summary>UC-29: Get Banner by ID</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<BannerDto>> GetBanner(int id)
    {
        var banner = await _context.Banners.FindAsync(id);
        if (banner == null) return NotFound(new { message = "Banner không tồn tại." });

        return Ok(new BannerDto
        {
            BannerID = banner.BannerID,
            Title = banner.Title,
            Subtitle = banner.Subtitle,
            ImageUrl = banner.ImageUrl,
            LinkUrl = banner.LinkUrl,
            DisplayOrder = banner.DisplayOrder,
            IsActive = banner.IsActive,
            CreatedAt = banner.CreatedAt,
            UpdatedAt = banner.UpdatedAt
        });
    }

    /// <summary>UC-29: Create Banner</summary>
    [HttpPost]
    public async Task<ActionResult<BannerDto>> CreateBanner([FromBody] CreateBannerDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var banner = new Banner
        {
            Title = dto.Title,
            Subtitle = dto.Subtitle,
            ImageUrl = dto.ImageUrl,
            LinkUrl = dto.LinkUrl,
            DisplayOrder = dto.DisplayOrder,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.Now
        };

        _context.Banners.Add(banner);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBanner), new { id = banner.BannerID }, new BannerDto
        {
            BannerID = banner.BannerID,
            Title = banner.Title,
            Subtitle = banner.Subtitle,
            ImageUrl = banner.ImageUrl,
            LinkUrl = banner.LinkUrl,
            DisplayOrder = banner.DisplayOrder,
            IsActive = banner.IsActive,
            CreatedAt = banner.CreatedAt
        });
    }

    /// <summary>UC-29: Update Banner</summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBanner(int id, [FromBody] UpdateBannerDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var banner = await _context.Banners.FindAsync(id);
        if (banner == null) return NotFound(new { message = "Banner không tồn tại." });

        banner.Title = dto.Title;
        banner.Subtitle = dto.Subtitle;
        banner.ImageUrl = dto.ImageUrl;
        banner.LinkUrl = dto.LinkUrl;
        banner.DisplayOrder = dto.DisplayOrder;
        banner.IsActive = dto.IsActive;
        banner.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>UC-29: Toggle Banner Active Status</summary>
    [HttpPatch("{id}/toggle-active")]
    public async Task<IActionResult> ToggleBannerActive(int id)
    {
        var banner = await _context.Banners.FindAsync(id);
        if (banner == null) return NotFound(new { message = "Banner không tồn tại." });

        banner.IsActive = !banner.IsActive;
        banner.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return Ok(new { isActive = banner.IsActive });
    }

    /// <summary>UC-29: Delete Banner</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBanner(int id)
    {
        var banner = await _context.Banners.FindAsync(id);
        if (banner == null) return NotFound(new { message = "Banner không tồn tại." });

        _context.Banners.Remove(banner);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
