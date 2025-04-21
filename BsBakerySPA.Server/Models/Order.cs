namespace BsBakerySPA.Server.Models
{
    public class Order
    {
        public string Id { get; set; } // Order ID
        public string UserId { get; set; } // Firebase UID
        public List<string> Items { get; set; } // List of item names
        public decimal TotalPrice { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}