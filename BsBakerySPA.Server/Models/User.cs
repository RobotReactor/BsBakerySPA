using System.ComponentModel.DataAnnotations; // Required for [Key]

public class User
{
    [Key] // Designates FirebaseUid as the primary key
    public string FirebaseUid { get; set; }

    [Required] // Makes FirstName mandatory
    [MaxLength(100)] // Example: Limit length
    public string FirstName { get; set; }

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; }

    [Required]
    [EmailAddress] // Basic email format validation
    public string Email { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // Default to current UTC time

    // Navigation property: A user can have multiple orders
    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
}
