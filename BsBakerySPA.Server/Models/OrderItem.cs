using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class OrderItem
{
    [Key]
    public int OrderItemId { get; set; }

    [Required]
    [MaxLength(50)] // Assuming IDs like 'L001', 'B002'
    public string ProductId { get; set; } // Changed from ProductName

    [Required]
    public int Quantity { get; set; }

    [Required]
    [Column(TypeName = "decimal(18, 2)")]
    public decimal PricePerItem { get; set; } // Final price for this item, including options

    // Store selected topping IDs as JSON array: e.g., "[\"T001\", \"T000\"]"
    public string? SelectedToppingIdsJson { get; set; }

    // Store bagel distribution as JSON object: e.g., "{\"T001\": 3, \"T000\": 3}"
    public string? BagelDistributionJson { get; set; }

    // --- Foreign Key Relationship to Order ---
    [Required]
    public int OrderId { get; set; }

    [ForeignKey("OrderId")]
    public virtual Order Order { get; set; }
}
