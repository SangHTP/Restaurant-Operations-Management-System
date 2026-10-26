using Microsoft.EntityFrameworkCore;
using RestaurantAPI.Models;

namespace RestaurantAPI.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Core tables
    public DbSet<Area> Areas => Set<Area>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Promotion> Promotions => Set<Promotion>();
    public DbSet<Shift> Shifts => Set<Shift>();

    // People
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Account> Accounts => Set<Account>();

    // Restaurant operations
    public DbSet<Table> Tables => Set<Table>();
    public DbSet<Assignment> Assignments => Set<Assignment>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<DailyInventory> DailyInventories => Set<DailyInventory>();

    // Orders & Billing
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderDetail> OrderDetails => Set<OrderDetail>();
    public DbSet<OrderTable> OrderTables => Set<OrderTable>();
    public DbSet<Bill> Bills => Set<Bill>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Reservation> Reservations => Set<Reservation>();

    // Feedback (UC-51 to UC-58)
    public DbSet<Feedback> Feedbacks => Set<Feedback>();
    public DbSet<FeedbackReply> FeedbackReplies => Set<FeedbackReply>();
    public DbSet<ReservationFeedback> ReservationFeedbacks => Set<ReservationFeedback>();

    // Content Management (UC-29, UC-30)
    public DbSet<Banner> Banners => Set<Banner>();
    public DbSet<News> News => Set<News>();

    // Logging & Scheduling
    public DbSet<ActionLog> ActionLogs => Set<ActionLog>();
    public DbSet<WorkAvailability> WorkAvailabilities => Set<WorkAvailability>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Composite key for OrderTables
        modelBuilder.Entity<OrderTable>()
            .HasKey(ot => new { ot.OrderID, ot.TableID });

        modelBuilder.Entity<ReservationFeedback>()
            .HasIndex(feedback => feedback.ReservationID)
            .IsUnique();
    }
}
