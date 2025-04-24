// BsBakerySPA.Server/Data/DesignTimeDbContextFactory.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using System.IO;

namespace BsBakerySPA.Server.Data
{
    // This factory is used by the EF Core tools (like dotnet ef migrations add)
    // to create a DbContext instance at design time, separate from runtime DI setup.
    public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
    {
        public ApplicationDbContext CreateDbContext(string[] args)
        {
            // Get the current directory (usually the project root where 'dotnet ef' is run)
            string basePath = Directory.GetCurrentDirectory();

            // Build configuration manually to read appsettings.json and appsettings.Development.json
            // This mimics how the application might load configuration but works at design time.
            IConfigurationRoot configuration = new ConfigurationBuilder()
                .SetBasePath(basePath)
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"}.json", optional: true) // Load environment-specific settings
                .AddEnvironmentVariables() // Optionally load from environment variables
                .Build();

            var builder = new DbContextOptionsBuilder<ApplicationDbContext>();

            // Get the connection string from the configuration sources
            var connectionString = configuration.GetConnectionString("DefaultConnection");

            // If DefaultConnection is not found, use the fallback defined in Program.cs
            if (string.IsNullOrEmpty(connectionString))
            {
                 connectionString = "Data Source=bsbakery.db"; // Ensure this matches your Program.cs fallback
                 // Optional: Log a warning if you have logging setup for design time
                 // Console.WriteLine("Warning: DesignTimeDbContextFactory using fallback connection string.");
            }

            // Configure the DbContext to use SQLite with the retrieved connection string
            builder.UseSqlite(connectionString);

            // Create and return the DbContext instance using the configured options
            return new ApplicationDbContext(builder.Options);
        }
    }
}
