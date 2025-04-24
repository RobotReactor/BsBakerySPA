using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BsBakerySPA.Server.Models 
{
 public class OrderItem
    {
        [Key]
        public int OrderItemId { get; set; }

        [Required]
        [MaxLength(50)]
        public string ProductId { get; set; } = string.Empty; // Initialize

        [Required]
        public int Quantity { get; set; }

        [Required]
        [Column(TypeName = "decimal(18, 2)")]
        public decimal PricePerItem { get; set; }

        public string? SelectedToppingIdsJson { get; set; }
        public string? BagelDistributionJson { get; set; }

        // --- Foreign Key Relationship to Order ---
        [Required]
        public int OrderId { get; set; }

        [ForeignKey("OrderId")]
        public virtual Order Order { get; set; } = null!; // Use null-forgiving for EF navigation
    }
}