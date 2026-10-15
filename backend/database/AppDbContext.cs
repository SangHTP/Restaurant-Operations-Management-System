using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.database
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Promotion> Promotions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Cấu hình Unique Index cho mã Code
            modelBuilder.Entity<Promotion>()
                .HasIndex(p => p.Code)
                .IsUnique();
        }
    }
}