// BsBakerySPA.Server/Controllers/UserController.cs
using Microsoft.AspNetCore.Mvc;
using BsBakerySPA.Server.Models;
using BsBakerySPA.Server.Data;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.ComponentModel.DataAnnotations;

namespace BsBakerySPA.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<UserController> _logger;

        public UserController(ApplicationDbContext context, ILogger<UserController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // --- Existing GetUserProfileAsync method ---
        [HttpGet("profile", Name = "GetUserProfile")]
        [Authorize]
        public async Task<IActionResult> GetUserProfileAsync()
        {
            // ... (keep existing code here) ...
             var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("User ID claim (NameIdentifier) not found in token.");
                return Unauthorized("User ID not found in token.");
            }

            _logger.LogInformation("Attempting to get profile for user FirebaseUid: {UserId}", userId);

            try
            {
                var userProfile = await _context.Users
                                                .AsNoTracking()
                                                .Where(u => u.FirebaseUid == userId)
                                                .Select(u => new UserProfileDto
                                                {
                                                    FirebaseUid = u.FirebaseUid,
                                                    FirstName = u.FirstName ?? string.Empty,
                                                    LastName = u.LastName ?? string.Empty,
                                                    Email = u.Email ?? string.Empty,
                                                    CreatedAt = u.CreatedAt
                                                })
                                                .FirstOrDefaultAsync();

                if (userProfile == null)
                {
                    _logger.LogWarning("User profile not found in database for FirebaseUid: {UserId}", userId);
                    return NotFound("User profile not found.");
                }

                _logger.LogInformation("Successfully retrieved profile for user FirebaseUid: {UserId}", userId);
                return Ok(userProfile);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching profile for user FirebaseUid: {UserId}", userId);
                return StatusCode(500, "An internal error occurred while retrieving the user profile.");
            }
        }

        // [HttpDelete("clear-all-users")] // Use a distinct route
        // public async Task<IActionResult> ClearAllUsers()
        // {
        //     _logger.LogWarning("Executing temporary endpoint to clear ALL users from the database.");
        //     try
        //     {
        //         // Efficiently delete all rows without loading them into memory
        //         int rowsAffected = await _context.Users.ExecuteDeleteAsync();

        //         // Alternatively, if ExecuteDeleteAsync isn't available or you prefer:
        //         // var allUsers = await _context.Users.ToListAsync();
        //         // if (allUsers.Any())
        //         // {
        //         //     _context.Users.RemoveRange(allUsers);
        //         //     await _context.SaveChangesAsync();
        //         // }

        //         _logger.LogWarning("Successfully deleted {RowCount} users.", rowsAffected);
        //         return Ok($"Successfully deleted {rowsAffected} users.");
        //     }
        //     catch (Exception ex)
        //     {
        //         _logger.LogError(ex, "Error occurred while clearing users.");
        //         return StatusCode(500, "An error occurred while clearing users.");
        //     }
        // }

        // --- NEW: Add POST endpoint to create user profile ---
        [HttpPost]
        [Authorize] // Ensure only authenticated users can create a profile
        public async Task<IActionResult> CreateUserProfileAsync([FromBody] UserProfileCreateDto profileDto)
        {
            // 1. Get Firebase UID from the validated token
            var firebaseUid = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(firebaseUid))
            {
                _logger.LogWarning("CreateUserProfileAsync: Firebase UID claim not found in token.");
                // This shouldn't happen if [Authorize] is working, but good to check
                return Unauthorized("Firebase UID not found in token.");
            }

            // Optional: Get email from token claims as well
            var email = User.FindFirstValue(ClaimTypes.Email);

            _logger.LogInformation("Attempting to create profile for Firebase UID: {FirebaseUid}", firebaseUid);

            // 2. Check if user already exists in our database
            var existingUser = await _context.Users
                                             .AsNoTracking() // No need to track for a check
                                             .AnyAsync(u => u.FirebaseUid == firebaseUid);

            if (existingUser)
            {
                _logger.LogWarning("CreateUserProfileAsync: User profile already exists for Firebase UID: {FirebaseUid}", firebaseUid);
                // Return Conflict or BadRequest if the profile already exists
                return Conflict("User profile already exists.");
            }

            var newUser = new User 
            {
                FirebaseUid = firebaseUid,
                FirstName = profileDto.FirstName,
                LastName = profileDto.LastName,
                Email = email ?? string.Empty, 
                CreatedAt = DateTime.UtcNow 
            };

            // 4. Add to DbContext and Save
            try
            {
                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully created profile for Firebase UID: {FirebaseUid}", firebaseUid);

                // 5. Return success response (e.g., 201 Created)
                var createdProfileDto = new UserProfileDto
                {
                    FirebaseUid = newUser.FirebaseUid,
                    FirstName = newUser.FirstName ?? string.Empty,
                    LastName = newUser.LastName ?? string.Empty,
                    Email = newUser.Email ?? string.Empty,
                    CreatedAt = newUser.CreatedAt
                };

                // --- Use CreatedAtRoute ---
                // Use the route name defined in the [HttpGet] attribute
                return CreatedAtRoute(
                    routeName: "GetUserProfile", // Match the Name property
                    routeValues: null,           // No route parameters needed
                    value: createdProfileDto);
                // --- End Use CreatedAtRoute ---
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error occurred while creating profile for Firebase UID: {FirebaseUid}", firebaseUid);
                return StatusCode(500, "An internal database error occurred while creating the profile.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unexpected error occurred while creating profile for Firebase UID: {FirebaseUid}", firebaseUid);
                return StatusCode(500, "An internal error occurred while creating the profile.");
            }
        }
        // --- END NEW POST endpoint ---

        // --- Existing DTOs ---
        public class UserProfileDto
        {
            public string FirebaseUid { get; set; } = string.Empty;
            public string FirstName { get; set; } = string.Empty;
            public string LastName { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public DateTime CreatedAt { get; set; }
        }

        public class UserProfileCreateDto
        {
            [Required(ErrorMessage = "First name is required.")]
            [StringLength(50, ErrorMessage = "First name cannot be longer than 50 characters.")]
            public string FirstName { get; set; } = string.Empty;

            [Required(ErrorMessage = "Last name is required.")]
            [StringLength(50, ErrorMessage = "Last name cannot be longer than 50 characters.")]
            public string LastName { get; set; } = string.Empty;
        }
    }
}
