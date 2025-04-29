using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BsBakerySPA.Server.Models
{
    public class Product
    {
        [Key] 
        [MaxLength(50)] 
        public string Id { get; set; } = string.Empty; 

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty; 

        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = string.Empty; 

        [Required]
        [Column(TypeName = "decimal(18, 2)")]
        public decimal Price { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; } 

    }
}