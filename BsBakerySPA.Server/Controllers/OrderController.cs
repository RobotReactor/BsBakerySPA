using Microsoft.AspNetCore.Mvc;
using BsBakerySPA.Server.Models;

namespace BsBakerySPA.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrderController : ControllerBase
    {
        [HttpGet("{userId}")]
        public IActionResult GetOrders(string userId)
        {
            // Simulate fetching orders for a user
            var orders = new List<Order>
            {
                new Order
                {
                    Id = "1",
                    UserId = userId,
                    Items = new List<string> { "Bagels", "Loaf" },
                    TotalPrice = 25.00m,
                    CreatedAt = DateTime.UtcNow
                }
            };

            return Ok(orders);
        }

        [HttpPost]
        public IActionResult CreateOrder([FromBody] Order order)
        {
            // Simulate saving order to database
            order.CreatedAt = DateTime.UtcNow;
            return CreatedAtAction(nameof(GetOrders), new { userId = order.UserId }, order);
        }
    }
}