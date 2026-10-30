
using backend.database;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    // Có thể bật Swagger tại đây nếu đã cài đặt Swashbuckle.
}

app.UseRouting();

// CORS phải được cấu hình trước Authorization và các endpoint.
app.UseCors("AllowFrontend");

app.UseAuthorization();
app.MapControllers();

app.Run();
