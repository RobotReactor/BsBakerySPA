// BsBakerySPA.Server/Controllers/UserController.cs
using Microsoft.AspNetCore.Mvc;
using BsBakerySPA.Server.Models;
using BsBakerySPA.Server.Data;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.ComponentModel.DataAnnotations;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;


namespace BsBakerySPA.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<UserController> _logger;
        private readonly IConfiguration _configuration;


        public UserController(ApplicationDbContext context, ILogger<UserController> logger, IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
        }

        // --- Existing GetUserProfileAsync method ---
        [HttpGet("profile", Name = "GetUserProfile")]
        [Authorize]
        public async Task<IActionResult> GetUserProfileAsync()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("User ID claim (NameIdentifier) not found in token.");
                return Unauthorized("User ID not found in token.");
            }

            _logger.LogInformation("Attempting to get profile for user FirebaseUid: {UserId}", userId);

            // Determine if the user is an admin
            bool isAdmin = CheckIfUserIsAdmin(userId);

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
                                                    // IsAdmin will be set below
                                                })
                                                .FirstOrDefaultAsync();

                if (userProfile == null)
                {
                    _logger.LogWarning("User profile not found in database for FirebaseUid: {UserId}", userId);
                    return NotFound("User profile not found.");
                }

                // --- Assign the calculated admin status to the DTO ---
                userProfile.IsAdmin = isAdmin;
                // ---

                // Log the status being sent back
                _logger.LogInformation("Successfully retrieved profile for user FirebaseUid: {UserId}. IsAdmin: {IsAdmin}", userId, userProfile.IsAdmin);
                return Ok(userProfile); // Return the DTO with the IsAdmin flag set
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching profile for user FirebaseUid: {UserId}", userId);
                return StatusCode(500, "An internal error occurred while retrieving the user profile.");
            }
        }

        private bool CheckIfUserIsAdmin(string firebaseUid)
        {
            _logger.LogInformation("--- CheckIfUserIsAdmin ---"); // Log entry point
            _logger.LogInformation("Checking admin status for Firebase UID: '{FirebaseUid}'", firebaseUid); // Log the UID received

            // Read the list of admin UIDs from configuration
            var adminUserIds = _configuration.GetSection("AdminSettings:AdminUserIds").Get<List<string>>();

            // Log the result of reading the configuration
            if (adminUserIds == null)
            {
                _logger.LogWarning("AdminUserIds list loaded from configuration is NULL.");
            }
            else
            {
                _logger.LogInformation("AdminUserIds loaded from configuration: [{AdminIds}]", string.Join(", ", adminUserIds));
            }

            // Perform the check
            bool isAdmin = adminUserIds != null && adminUserIds.Contains(firebaseUid);

            // Log the result of the check
            _logger.LogInformation("Result of admin check (adminUserIds != null && adminUserIds.Contains(firebaseUid)): {IsAdminResult}", isAdmin);
            _logger.LogInformation("--- End CheckIfUserIsAdmin ---"); // Log exit point

            return isAdmin;
        }
        [HttpPost]
        [Authorize]
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

                bool isAdmin = CheckIfUserIsAdmin(firebaseUid);


                // 5. Return success response (e.g., 201 Created)
                var createdProfileDto = new UserProfileDto
                {
                    FirebaseUid = newUser.FirebaseUid,
                    FirstName = newUser.FirstName ?? string.Empty,
                    LastName = newUser.LastName ?? string.Empty,
                    Email = newUser.Email ?? string.Empty,
                    CreatedAt = newUser.CreatedAt,
                    IsAdmin = isAdmin
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
            public bool IsAdmin { get; set; }
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
