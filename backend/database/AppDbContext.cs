
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
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderDetail> OrderDetails { get; set; }
        public DbSet<OrderTable> OrderTables { get; set; }

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
            // Order - OrderTable
            modelBuilder.Entity<OrderTable>()
                .HasKey(ot => new { ot.OrderID, ot.TableID });

            modelBuilder.Entity<OrderTable>()
                .HasOne(ot => ot.Order)
                .WithMany(o => o.OrderTables)
                .HasForeignKey(ot => ot.OrderID)
                .OnDelete(DeleteBehavior.Cascade);

            // Table - OrderTable
            modelBuilder.Entity<OrderTable>()
                .HasOne(ot => ot.Table)
                .WithMany()
                .HasForeignKey(ot => ot.TableID)
                .OnDelete(DeleteBehavior.Restrict);

            // Order - OrderDetail
            modelBuilder.Entity<Order>()
                .HasMany(o => o.OrderDetails)
                .WithOne(d => d.Order)
                .HasForeignKey(d => d.OrderID)
                .OnDelete(DeleteBehavior.Cascade);

            // OrderDetail - MenuItem
            modelBuilder.Entity<OrderDetail>()
                .HasOne(d => d.MenuItem)
                .WithMany()
                .HasForeignKey(d => d.MenuItemID)
                .OnDelete(DeleteBehavior.Restrict);

            // Order - Bill (one-to-one)
            modelBuilder.Entity<Order>()
                .HasOne(o => o.Bill)
                .WithOne(b => b.Order)
                .HasForeignKey<Bill>(b => b.OrderID)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<OrderDetail>()
                .ToTable("OrderDetails", table =>
                    table.HasTrigger("TRG_Deduct_Inventory"));
        }
    }
}
