using System.ComponentModel.DataAnnotations;

namespace BsBakerySPA.Server.Models
{
    public class BagelTopping
    {
        [Key] 
        [MaxLength(50)]
        public string Id { get; set; } = string.Empty; 

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty; 

    }
}