// Data/ApplicationDbContext.cs
using Microsoft.EntityFrameworkCore;
using BsBakerySPA.Server.Models; // Assuming your models are here

namespace BsBakerySPA.Server.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // Existing DbSets
        public DbSet<User> Users { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<TestModel> TestModels { get; set; }

        // --- Add New DbSets ---
        public DbSet<Product> Products { get; set; }
        public DbSet<BagelTopping> BagelToppings { get; set; }
        // --- End New DbSets ---

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // --- Configure Relationships and Keys ---

            // User Configuration (Existing)
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.FirebaseUid);
                entity.Property(u => u.FirstName).HasMaxLength(100);
                entity.Property(u => u.LastName).HasMaxLength(100);
                entity.Property(u => u.Email).HasMaxLength(255);
                entity.HasMany(u => u.Orders)
                      .WithOne(o => o.User)
                      .HasForeignKey(o => o.UserFirebaseUid)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Order Configuration (Existing)
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasKey(o => o.OrderId);
                entity.Property(o => o.OrderId).ValueGeneratedOnAdd();
                entity.Property(o => o.TotalAmount).HasColumnType("decimal(18,2)");
                entity.Property(o => o.DiscountApplied).HasColumnType("decimal(18,2)");
                entity.HasMany(o => o.OrderItems)
                      .WithOne(oi => oi.Order)
                      .HasForeignKey(oi => oi.OrderId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // OrderItem Configuration (Existing)
            modelBuilder.Entity<OrderItem>(entity =>
            {
                entity.HasKey(oi => oi.OrderItemId);
                entity.Property(oi => oi.OrderItemId).ValueGeneratedOnAdd();
                entity.Property(oi => oi.PricePerItem).HasColumnType("decimal(18,2)");
                // Note: No explicit relationship to Product here since ProductId is just a string FK
                // If you added a Product navigation property to OrderItem, configure it here.
            });

            // --- Add New Configurations ---

            // Product Configuration
            modelBuilder.Entity<Product>(entity =>
            {
                // Key is already defined via [Key] attribute on the string Id
                entity.Property(p => p.Price).HasColumnType("decimal(18,2)"); // Ensure precision
                entity.Property(p => p.Category).HasMaxLength(50);
                entity.Property(p => p.Name).HasMaxLength(100);
                entity.Property(p => p.Description).HasMaxLength(500);
            });

            // BagelTopping Configuration
            modelBuilder.Entity<BagelTopping>(entity =>
            {
                // Key is already defined via [Key] attribute on the string Id
                entity.Property(bt => bt.Name).HasMaxLength(100);
                // Configure Price precision if you added a Price property
                // entity.Property(bt => bt.Price).HasColumnType("decimal(18,2)");
            });

            // --- End New Configurations ---

            // Add more configurations for other entities as needed
        }
    }
}
