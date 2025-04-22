using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Order
{
    [Key]
    public int OrderId { get; set; } // Or use Guid OrderId { get; set; } = Guid.NewGuid();

    [Required]
    public DateTime OrderTimestamp { get; set; } = DateTime.UtcNow;

    [Required]
    [MaxLength(50)] // e.g., "Placed", "Preparing", "Ready", "Completed", "Cancelled"
    public string Status { get; set; } = "Placed"; // Default status

    [Column(TypeName = "decimal(18, 2)")] // Specify SQL data type for currency
    public decimal TotalAmount { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal DiscountApplied { get; set; } = 0;

    // --- Foreign Key Relationship to User ---
    [Required]
    public string UserFirebaseUid { get; set; } // The FK field

    [ForeignKey("UserFirebaseUid")] // Links to the UserFirebaseUid property above
    public virtual User User { get; set; } // Navigation property back to the User

    // --- Relationship to OrderItems ---
    // Navigation property: An order contains multiple items
    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
