using Microsoft.EntityFrameworkCore;
using BsBakerySPA.Server.Models; 

namespace BsBakerySPA.Server.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<TestModel> TestModels { get; set; }

        public DbSet<Product> Products { get; set; }
        public DbSet<BagelTopping> BagelToppings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

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
            });

            // Product Configuration
            modelBuilder.Entity<Product>(entity =>
            {
                // Key is already defined via [Key] attribute on the string Id
                entity.Property(p => p.Price).HasColumnType("decimal(18,2)");
                entity.Property(p => p.Category).HasMaxLength(50);
                entity.Property(p => p.Name).HasMaxLength(100);
                entity.Property(p => p.Description).HasMaxLength(500);
            });

            // BagelTopping Configuration
            modelBuilder.Entity<BagelTopping>(entity =>
            {
                entity.Property(bt => bt.Name).HasMaxLength(100);
            });

            modelBuilder.Entity<BagelTopping>().HasData(
                new BagelTopping { Id = "T000", Name = "Plain", Price = 0m  }, 
                new BagelTopping { Id = "T001", Name = "Cheddar", Price = 1.00m }, 
                new BagelTopping { Id = "T002", Name = "Asiago", Price = 1.00m },
                new BagelTopping { Id = "T003", Name = "Sesame", Price = 1.00m },
                new BagelTopping { Id = "T004", Name = "Everything", Price = 1.00m },
                new BagelTopping { Id = "T005", Name = "Cheddar Jalapeño", Price = 1.00m }
            );

            modelBuilder.Entity<Product>().HasData(
                // Loafs
                new Product { Id = "L001", Name = "Regular", Category = "Loaf", Price = 12.00m },
                new Product { Id = "L002", Name = "Pepperoni Mozzarella", Category = "Loaf", Price = 14.00m },
                new Product { Id = "L003", Name = "Cheddar Jalapeño", Category = "Loaf", Price = 14.00m },
                new Product { Id = "L004", Name = "Cinnamon Apple", Category = "Loaf", Price = 14.00m },
                new Product { Id = "L005", Name = "Everything Loaf", Category = "Loaf", Price = 14.00m },
                // Bagels
                new Product { Id = "B001", Name = "1/2 Dozen Bagels", Category = "Bagel", Price = 12.00m },
                new Product { Id = "B002", Name = "Dozen Bagels", Category = "Bagel", Price = 22.00m }, 
                // Cookies
                new Product { Id = "C001", Name = "Chocolate Chip Cookies (Dozen)", Category = "Cookie", Price = 20.00m } 
            );
        }
    }
}
