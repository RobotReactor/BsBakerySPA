using System.ComponentModel.DataAnnotations; 

namespace BsBakerySPA.Server.Models 
{
    public class User
    {
        public int Id { get; set; }
        [Key]
        public string FirebaseUid { get; set; } = string.Empty; 

        [Required]
        [MaxLength(100)]
        public string FirstName { get; set; } = string.Empty; 

        [Required]
        [MaxLength(100)]
        public string LastName { get; set; } = string.Empty; 

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty; 

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
    }
}