namespace BsBakerySPA.Server.Models 
{
    public class TestModel
    {
        public int Id { get; set; }

        public string? Name { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}