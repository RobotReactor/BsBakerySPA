using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BsBakerySPA.Server.Models
{
    public class Product
    {
        [Key] // Use [Key] since 'Id' is a string and not the conventional int 'Id' or 'ProductId'
        [MaxLength(50)] // Define a max length for the string key
        public string Id { get; set; } = string.Empty; // e.g., "L001", "B001", "C003"

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty; // e.g., "Regular Loaf", "Half Dozen Bagels"

        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = string.Empty; // e.g., "Loaf", "Bagel", "Cookie" - useful for logic

        [Required]
        [Column(TypeName = "decimal(18, 2)")]
        public decimal Price { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; } // Optional description

    }
}