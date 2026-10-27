using System.IO;
using System.Text;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantAPI.Data;
using RestaurantAPI.Models;
using RestaurantAPI.Models.DTOs;

namespace RestaurantAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NewsController : ControllerBase
{
    private const long MaxImageSize = 5 * 1024 * 1024;

    private static readonly HashSet<string> AllowedImageExtensions =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp",
            ".gif"
        };

    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public NewsController(AppDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    /// <summary>Upload an image for a news article.</summary>
    [HttpPost("upload-image")]
    [RequestSizeLimit(MaxImageSize + 64 * 1024)]
    public async Task<IActionResult> UploadImage([FromForm] IFormFile? file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Please select an image." });

        if (file.Length > MaxImageSize)
            return BadRequest(new { message = "Image size must not exceed 5 MB." });

        var extension = Path.GetExtension(file.FileName);
        if (!AllowedImageExtensions.Contains(extension))
            return BadRequest(new { message = "Only JPG, PNG, WEBP, and GIF images are supported." });

        if (!await HasValidImageSignature(file, extension))
            return BadRequest(new { message = "The selected file is not a valid image." });

        var webRoot = _environment.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRoot))
            webRoot = Path.Combine(_environment.ContentRootPath, "wwwroot");

        var uploadDirectory = Path.Combine(webRoot, "uploads", "news");
        Directory.CreateDirectory(uploadDirectory);

        var fileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var filePath = Path.Combine(uploadDirectory, fileName);

        await using (var destination = System.IO.File.Create(filePath))
        {
            await file.CopyToAsync(destination);
        }

        var imageUrl = $"{Request.Scheme}://{Request.Host}/uploads/news/{fileName}";
        return Ok(new { url = imageUrl });
    }

    private static async Task<bool> HasValidImageSignature(IFormFile file, string extension)
    {
        var header = new byte[12];

        await using var stream = file.OpenReadStream();
        var bytesRead = await stream.ReadAsync(header.AsMemory());

        return extension.ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" =>
                bytesRead >= 3 &&
                header[0] == 0xFF &&
                header[1] == 0xD8 &&
                header[2] == 0xFF,

            ".png" =>
                bytesRead >= 8 &&
                header.AsSpan(0, 8).SequenceEqual(
                    new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }),

            ".gif" =>
                bytesRead >= 6 &&
                (Encoding.ASCII.GetString(header, 0, 6) is "GIF87a" or "GIF89a"),

            ".webp" =>
                bytesRead >= 12 &&
                Encoding.ASCII.GetString(header, 0, 4) == "RIFF" &&
                Encoding.ASCII.GetString(header, 8, 4) == "WEBP",

            _ => false
        };
    }

    /// <summary>UC-30: View News List</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<NewsListDto>>> GetNews(
        [FromQuery] bool? isPublished = null,
        [FromQuery] bool? isFeatured = null,
        [FromQuery] string? category = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _context.News.AsQueryable();

        if (isPublished.HasValue)
            query = query.Where(n => n.IsPublished == isPublished.Value);

        if (isFeatured.HasValue)
            query = query.Where(n => n.IsFeatured == isFeatured.Value);

        if (!string.IsNullOrEmpty(category))
            query = query.Where(n => n.Category == category);

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(n =>
                n.Title.Contains(search) ||
                (n.Summary != null && n.Summary.Contains(search)));
        }

        var totalCount = await query.CountAsync();

        var news = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NewsListDto
            {
                NewsID = n.NewsID,
                Title = n.Title,
                Summary = n.Summary,
                Content = n.Content,
                ThumbnailUrl = n.ThumbnailUrl,
                Category = n.Category,
                Author = n.Author,
                IsPublished = n.IsPublished,
                IsFeatured = n.IsFeatured,
                ViewCount = n.ViewCount,
                CreatedAt = n.CreatedAt,
                PublishedAt = n.PublishedAt
            })
            .ToListAsync();

        return Ok(new PagedResult<NewsListDto>
        {
            Items = news,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    /// <summary>UC-30: View News Detail</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<NewsDto>> GetNewsById(int id)
    {
        var news = await _context.News.FindAsync(id);
        if (news == null)
            return NotFound(new { message = "Article not found." });

        news.ViewCount++;
        await _context.SaveChangesAsync();

        return Ok(new NewsDto
        {
            NewsID = news.NewsID,
            Title = news.Title,
            Summary = news.Summary,
            Content = news.Content,
            ThumbnailUrl = news.ThumbnailUrl,
            Category = news.Category,
            Author = news.Author,
            IsPublished = news.IsPublished,
            IsFeatured = news.IsFeatured,
            ViewCount = news.ViewCount,
            CreatedAt = news.CreatedAt,
            UpdatedAt = news.UpdatedAt,
            PublishedAt = news.PublishedAt
        });
    }

    /// <summary>UC-30: Create News</summary>
    [HttpPost]
    public async Task<ActionResult<NewsDto>> CreateNews([FromBody] CreateNewsDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var news = new News
        {
            Title = dto.Title,
            Summary = dto.Summary,
            Content = dto.Content,
            ThumbnailUrl = dto.ThumbnailUrl,
            Category = dto.Category,
            Author = dto.Author,
            IsPublished = dto.IsPublished,
            IsFeatured = dto.IsFeatured,
            CreatedAt = DateTime.Now,
            PublishedAt = dto.IsPublished ? DateTime.Now : null
        };

        _context.News.Add(news);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetNewsById), new { id = news.NewsID }, new NewsDto
        {
            NewsID = news.NewsID,
            Title = news.Title,
            Summary = news.Summary,
            Content = news.Content,
            ThumbnailUrl = news.ThumbnailUrl,
            Category = news.Category,
            Author = news.Author,
            IsPublished = news.IsPublished,
            IsFeatured = news.IsFeatured,
            ViewCount = news.ViewCount,
            CreatedAt = news.CreatedAt,
            PublishedAt = news.PublishedAt
        });
    }

    /// <summary>UC-30: Update News</summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateNews(int id, [FromBody] UpdateNewsDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var news = await _context.News.FindAsync(id);
        if (news == null)
            return NotFound(new { message = "Article not found." });

        var wasPublished = news.IsPublished;

        news.Title = dto.Title;
        news.Summary = dto.Summary;
        news.Content = dto.Content;
        news.ThumbnailUrl = dto.ThumbnailUrl;
        news.Category = dto.Category;
        news.Author = dto.Author;
        news.IsPublished = dto.IsPublished;
        news.IsFeatured = dto.IsFeatured;
        news.UpdatedAt = DateTime.Now;

        if (!wasPublished && dto.IsPublished)
            news.PublishedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>UC-30: Delete News</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNews(int id)
    {
        var news = await _context.News.FindAsync(id);
        if (news == null)
            return NotFound(new { message = "Article not found." });

        _context.News.Remove(news);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>UC-30: Toggle Publish Status</summary>
    [HttpPatch("{id}/toggle-publish")]
    public async Task<IActionResult> TogglePublish(int id)
    {
        var news = await _context.News.FindAsync(id);
        if (news == null)
            return NotFound(new { message = "Article not found." });

        news.IsPublished = !news.IsPublished;
        news.UpdatedAt = DateTime.Now;

        if (news.IsPublished && news.PublishedAt == null)
            news.PublishedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return Ok(new { isPublished = news.IsPublished });
    }

    /// <summary>Get all available news categories</summary>
    [HttpGet("categories")]
    public async Task<ActionResult<IEnumerable<string>>> GetCategories()
    {
        var categories = await _context.News
            .Where(n => n.Category != null)
            .Select(n => n.Category!)
            .Distinct()
            .ToListAsync();

        return Ok(categories);
    }
}