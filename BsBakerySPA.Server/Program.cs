using Microsoft.EntityFrameworkCore;
using BsBakerySPA.Server.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.JsonWebTokens;
using System.Text.Json.Serialization;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

var allowedOrigin = builder.Configuration["AllowedCorsOrigin"] ?? "https://localhost:5173";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          policy.WithOrigins(allowedOrigin)
                                .AllowAnyHeader()
                                .AllowAnyMethod();
                      });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.Preserve;
    });

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrEmpty(connectionString))
{
    if (builder.Environment.IsDevelopment())
    {
        connectionString = "Data Source=bsbakery_dev.db";
        Console.WriteLine("Warning: DefaultConnection not found. Using local development SQLite database.");
    }
    else
    {
        throw new InvalidOperationException("Database connection string 'DefaultConnection' is not configured.");
    }
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(connectionString));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        string firebaseProjectId = builder.Configuration["Firebase:ProjectId"] ?? "bs-bakery-e7ef2";

        options.Authority = $"https://securetoken.google.com/{firebaseProjectId}";

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = $"https://securetoken.google.com/{firebaseProjectId}",
            ValidateAudience = true,
            ValidAudience = firebaseProjectId,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"Auth Failed: {context.Exception?.GetType().FullName} - {context.Exception?.Message}");
                if (context.Exception?.InnerException != null)
                {
                     Console.WriteLine($"Auth Failed Inner: {context.Exception.InnerException.GetType().FullName} - {context.Exception.InnerException.Message}");
                }
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                Console.WriteLine($"Token Validated for User: {context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier) ?? "Unknown"}");
                try
                {
                    string? kid = "Unknown";
                    if (context.SecurityToken is JwtSecurityToken jwtToken) { kid = jwtToken.Header?.Kid; }
                    else if (context.SecurityToken is JsonWebToken jsonWebToken) { kid = jsonWebToken.Kid; }
                    Console.WriteLine($"Token Validated with Key ID (kid): {kid ?? "Not Found"}");
                }
                catch (Exception ex) { Console.WriteLine($"Error accessing Key ID (kid): {ex.Message}"); }
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                Console.WriteLine($"OnChallenge: Authentication failed. Error: {context.Error}, Description: {context.ErrorDescription}");
                return Task.CompletedTask;
            },
             OnMessageReceived = context =>
             {
                var token = context.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
                if (!string.IsNullOrEmpty(token)) {
                    Console.WriteLine($"Token received: {token.Substring(0, Math.Min(token.Length, 20))}...");
                } else {
                    Console.WriteLine("No Authorization token found in request header.");
                }
                return Task.CompletedTask;
             }
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    Console.WriteLine("Development environment detected.");
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseDeveloperExceptionPage();
}
else
{
    Console.WriteLine("Production environment detected.");
    app.UseHsts();
}

app.UseHttpsRedirection();

app.UseCors(MyAllowSpecificOrigins);

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

Console.WriteLine("Pipeline configured. Running app...");
app.Run();
Console.WriteLine("Application shutting down...");
