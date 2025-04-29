using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BsBakerySPA.Server.Models 
{
    public class Order
    {
        [Key]
        public int OrderId { get; set; }

        [Required]
        public DateTime OrderTimestamp { get; set; } = DateTime.UtcNow;

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Placed";

        [Column(TypeName = "decimal(18, 2)")]
        public decimal TotalAmount { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal DiscountApplied { get; set; } = 0;

        [Required]
        public string UserFirebaseUid { get; set; } = string.Empty;

        [ForeignKey("UserFirebaseUid")]
        public virtual User User { get; set; } = null!; 

        public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}