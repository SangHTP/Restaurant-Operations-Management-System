
using backend.Models;
using Microsoft.EntityFrameworkCore;
using RestaurantAPI.Models;

namespace backend.database
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Promotion> Promotions { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<MenuItem> MenuItems { get; set; }
        public DbSet<Area> Areas { get; set; }
        public DbSet<Table> Tables { get; set; }
        public DbSet<Bill> Bills { get; set; }
        public DbSet<DailyInventory> DailyInventories { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Area>()
                .HasIndex(a => a.AreaName)
                .IsUnique();

            modelBuilder.Entity<Table>()
                .HasOne(t => t.Area)
                .WithMany()
                .HasForeignKey(t => t.AreaID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Promotion>()
                .HasIndex(p => p.Code)
                .IsUnique();

            modelBuilder.Entity<Category>()
                .HasIndex(c => c.CategoryName)
                .IsUnique();

            modelBuilder.Entity<MenuItem>()
                .HasOne(item => item.Category)
                .WithMany()
                .HasForeignKey(item => item.CategoryID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<OrderTable>()
                .HasKey(ot => new { ot.OrderID, ot.TableID });
        }
    }
}
