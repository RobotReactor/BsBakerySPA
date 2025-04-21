using Microsoft.AspNetCore.Mvc;
using BsBakerySPA.Server.Models;

namespace BsBakerySPA.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        [HttpGet("{id}")]
        public IActionResult GetUser(string id)
        {
            // Simulate fetching user from database
            var user = new User
            {
                Id = id,
                FirstName = "John",
                LastName = "Doe",
                Email = "john.doe@example.com",
                CreatedAt = DateTime.UtcNow
            };

            return Ok(user);
        }

        [HttpPost]
        public IActionResult CreateUser([FromBody] User user)
        {
            // Simulate saving user to database
            user.CreatedAt = DateTime.UtcNow;
            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
        }
    }
}