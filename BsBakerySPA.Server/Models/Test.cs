namespace BsBakerySPA.Server.Models 
{
    public class TestModel
    {
        // Primary Key - EF Core will automatically recognize 'Id' or 'TestModelId'
        public int Id { get; set; }

        // A simple property to store some data
        public string? Name { get; set; }

        // Maybe a timestamp to see when it was created
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}