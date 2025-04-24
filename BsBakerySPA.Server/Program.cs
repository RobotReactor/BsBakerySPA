using Microsoft.EntityFrameworkCore;
using BsBakerySPA.Server.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt; 
using Microsoft.IdentityModel.JsonWebTokens; 
using System.Text.Json.Serialization;

Console.WriteLine("Application starting...");

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.Preserve;
    });

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                       ?? "Data Source=bsbakery.db"; 

Console.WriteLine($"Using connection string: {connectionString}");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(connectionString)); // Use SQLite

// --- API Controllers ---
builder.Services.AddControllers();

// --- Authentication (Firebase JWT) ---
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // It's highly recommended to read these from configuration (appsettings.json or environment variables)
        // instead of hardcoding them.
        string firebaseProjectId = builder.Configuration["Firebase:ProjectId"] ?? "bs-bakery-e7ef2"; // Example fallback

        options.Authority = $"https://securetoken.google.com/{firebaseProjectId}";

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = $"https://securetoken.google.com/{firebaseProjectId}",
            ValidateAudience = true,
            ValidAudience = firebaseProjectId, // Audience is typically just the project ID
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero // Consider setting to zero for stricter validation if needed
        };

        // Enhanced logging for debugging authentication issues
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                // Log the full exception if available
                Console.WriteLine($"Auth Failed: {context.Exception?.GetType().FullName} - {context.Exception?.Message}");
                // Log inner exceptions too, if they exist
                if (context.Exception?.InnerException != null)
                {
                     Console.WriteLine($"Auth Failed Inner: {context.Exception.InnerException.GetType().FullName} - {context.Exception.InnerException.Message}");
                }
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                // Log the user principal name (often the Firebase UID from the 'sub' claim)
                Console.WriteLine($"Token Validated for User: {context.Principal?.Identity?.Name}"); // NameIdentifier claim usually maps here

                // Attempt to log the Key ID (kid) from the token header
                try
                {
                    string? kid = "Unknown";
                    // Check both potential token types used by the libraries
                    if (context.SecurityToken is JwtSecurityToken jwtToken)
                    {
                        kid = jwtToken.Header?.Kid;
                    }
                    else if (context.SecurityToken is JsonWebToken jsonWebToken)
                    {
                        kid = jsonWebToken.Kid;
                    }
                    Console.WriteLine($"Token Validated with Key ID (kid): {kid ?? "Not Found"}");
                }
                catch (Exception ex)
                {
                     Console.WriteLine($"Error accessing Key ID (kid): {ex.Message}");
                }
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                // Log when authentication fails and a challenge (401) is issued
                Console.WriteLine($"OnChallenge: Authentication failed. Error: {context.Error}, Description: {context.ErrorDescription}");
                // Prevent default redirect behavior if any; ensure it returns 401
                context.HandleResponse();
                return Task.CompletedTask;
            },
             OnMessageReceived = context =>
             {
                // Optional: Log the token as received (be careful logging full tokens in production)
                var token = context.Token;
                if (!string.IsNullOrEmpty(token)) {
                    Console.WriteLine($"Token received: {token.Substring(0, Math.Min(token.Length, 20))}..."); // Log prefix only
                }
                return Task.CompletedTask;
             }
        };
    });

// --- Authorization ---
builder.Services.AddAuthorization(); // Enables the use of [Authorize] attributes

// --- API Explorer & Swagger (for Development) ---
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --- SPA Static Files Configuration ---
// Serve static files from the client app's build output
builder.Services.AddSpaStaticFiles(configuration =>
{
    // Adjust path if your client project structure is different
    configuration.RootPath = "../bsbakeryspa.client/dist"; // Common path for Vite/React builds
});

// --- CORS Configuration ---
// Define a policy to allow requests from your development client host
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          // Replace with your actual client development URL
                          policy.WithOrigins("https://localhost:5173")
                                .AllowAnyHeader()
                                .AllowAnyMethod();
                          // For production, you might want more specific origins:
                          // policy.WithOrigins("https://your-production-domain.com")
                          //       .AllowAnyHeader()
                          //       .AllowAnyMethod();
                      });
});


// --- Build the Application ---
var app = builder.Build();


// --- Configure the HTTP request pipeline (Middleware Order Matters!) ---
if (app.Environment.IsDevelopment())
{
    Console.WriteLine("Development environment detected.");
    app.UseSwagger();
    app.UseSwaggerUI();
    // Use detailed error pages in development
    app.UseDeveloperExceptionPage();
    // Consider enabling database error page for EF Core issues in dev
    // app.UseMigrationsEndPoint();
}
else
{
    Console.WriteLine("Production environment detected.");
    // Optional: Add production exception handling (e.g., redirect to error page)
    // app.UseExceptionHandler("/Error");
    // Use HSTS to enforce HTTPS in production (recommended)
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

// Redirect HTTP requests to HTTPS (important for security)
app.UseHttpsRedirection();

// Serve static files for the SPA (like CSS, JS, images)
app.UseSpaStaticFiles();

// Apply the CORS policy defined above
app.UseCors(MyAllowSpecificOrigins);

// Enable routing to determine which endpoint to execute
app.UseRouting();

// --- Authentication & Authorization Middleware ---
// IMPORTANT: UseAuthentication must come before UseAuthorization
app.UseAuthentication(); // Attempts to identify the user from the request (e.g., validates JWT)
app.UseAuthorization();  // Checks if the identified user is permitted to access the requested endpoint

// Map controller endpoints
app.MapControllers();

// Configure SPA fallback routing:
// For any request that doesn't match an API route or a static file,
// serve the index.html file from the SPA's root path.
app.MapFallbackToFile("/index.html");

Console.WriteLine("Pipeline configured. Running app...");
app.Run(); // Start listening for requests

Console.WriteLine("Application shutting down..."); // This line might only be reached if shutdown is graceful
