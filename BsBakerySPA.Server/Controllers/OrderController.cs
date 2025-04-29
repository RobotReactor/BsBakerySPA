using BsBakerySPA.Server.Models;
using BsBakerySPA.Server.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace BsBakerySPA.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrderController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<OrderController> _logger;

        private static readonly List<string> AdminUserIds = new List<string> {
            "XKE46g6IuBNZSYDyfbPLDMILfwq1",
            "lujtPx1DerXyqicnWXwOiJI3JSK2"
        };

        public OrderController(ApplicationDbContext context, ILogger<OrderController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private bool IsAdminUser()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return !string.IsNullOrEmpty(userId) && AdminUserIds.Contains(userId);
        }

        public class CreateOrderRequestDto
        {
            [Required]
            [MinLength(1, ErrorMessage = "Order must contain at least one item.")]
            public List<CreateOrderItemDto> Items { get; set; } = new List<CreateOrderItemDto>();
        }

        public class CreateOrderItemDto
        {
            [Required]
            public string ProductId { get; set; } = string.Empty;

            [Range(1, 100, ErrorMessage = "Quantity must be between 1 and 100.")]
            public int Quantity { get; set; }

            public List<string>? SelectedToppingIds { get; set; }
            public Dictionary<string, int>? BagelDistribution { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequestDto orderDto)
        {
            var firebaseUid = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(firebaseUid))
            {
                _logger.LogWarning("CreateOrder called without valid Firebase UID in token.");
                return Unauthorized("User ID not found in token.");
            }

            _logger.LogInformation("Attempting to create order for user {FirebaseUid}", firebaseUid);

            var productIds = orderDto.Items.Select(i => i.ProductId).Distinct().ToList();
            var productsFromDb = await _context.Products
                                               .Where(p => productIds.Contains(p.Id))
                                               .AsNoTracking()
                                               .ToDictionaryAsync(p => p.Id);

            var allToppingIds = orderDto.Items
                                        .Where(i => i.SelectedToppingIds != null)
                                        .SelectMany(i => i.SelectedToppingIds!)
                                        .Distinct()
                                        .ToList();

            var toppingsFromDb = await _context.BagelToppings
                                               .Where(t => allToppingIds.Contains(t.Id))
                                               .AsNoTracking()
                                               .ToDictionaryAsync(t => t.Id);

            decimal calculatedSubtotal = 0m;
            var orderItems = new List<OrderItem>();

            foreach (var itemDto in orderDto.Items)
            {
                if (!productsFromDb.TryGetValue(itemDto.ProductId, out var product))
                {
                    _logger.LogWarning("CreateOrder: Invalid ProductId {ProductId} received for user {FirebaseUid}.", itemDto.ProductId, firebaseUid);
                    return BadRequest($"Product with ID '{itemDto.ProductId}' not found or unavailable.");
                }

                decimal currentItemToppingCost = 0m;
                if (itemDto.SelectedToppingIds != null && itemDto.SelectedToppingIds.Any())
                {
                    foreach (var toppingId in itemDto.SelectedToppingIds)
                    {
                        if (toppingsFromDb.TryGetValue(toppingId, out var topping))
                        {
                            currentItemToppingCost += topping.Price;
                        }
                        else
                        {
                            _logger.LogWarning("CreateOrder: Invalid ToppingId {ToppingId} for Product {ProductId} received for user {FirebaseUid}.", toppingId, itemDto.ProductId, firebaseUid);
                        }
                    }
                }

                decimal finalItemPrice = product.Price + currentItemToppingCost;

                var orderItem = new OrderItem
                {
                    ProductId = itemDto.ProductId,
                    Quantity = itemDto.Quantity,
                    PricePerItem = finalItemPrice,
                    SelectedToppingIdsJson = itemDto.SelectedToppingIds != null && itemDto.SelectedToppingIds.Any()
                                                ? JsonSerializer.Serialize(itemDto.SelectedToppingIds)
                                                : null,
                    BagelDistributionJson = itemDto.BagelDistribution != null && itemDto.BagelDistribution.Any()
                                                ? JsonSerializer.Serialize(itemDto.BagelDistribution)
                                                : null
                };
                orderItems.Add(orderItem);

                calculatedSubtotal += finalItemPrice * itemDto.Quantity;
            }

            decimal calculatedDiscount = CalculateDiscountFromServer(orderItems, productsFromDb);
            decimal calculatedTotal = calculatedSubtotal - calculatedDiscount;

            var newOrder = new Order
            {
                UserFirebaseUid = firebaseUid,
                OrderTimestamp = DateTime.UtcNow,
                Status = "Placed",
                OrderItems = orderItems,
                TotalAmount = calculatedTotal,
                DiscountApplied = calculatedDiscount
            };

            try
            {
                _context.Orders.Add(newOrder);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully created Order {OrderId} for user {FirebaseUid}", newOrder.OrderId, firebaseUid);

                return CreatedAtRoute("GetOrderById", new { id = newOrder.OrderId }, newOrder);
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error creating order for user {FirebaseUid}", firebaseUid);
                return StatusCode(500, "An error occurred while saving the order.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error creating order for user {FirebaseUid}", firebaseUid);
                return StatusCode(500, "An unexpected error occurred.");
            }
        }

        [HttpGet("my", Name = "GetMyOrders")]
        public async Task<IActionResult> GetMyOrders()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token.");
            }

            var orders = await _context.Orders
                                       .Where(o => o.UserFirebaseUid == userId)
                                       .Include(o => o.OrderItems)
                                       .OrderByDescending(o => o.OrderTimestamp)
                                       .AsNoTracking()
                                       .ToListAsync();

            return Ok(orders);
        }

        [HttpGet("{id:int}", Name = "GetOrderById")]
        public async Task<IActionResult> GetOrderById(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token.");
            }

            var order = await _context.Orders
                                      .Include(o => o.OrderItems)
                                      .AsNoTracking()
                                      .FirstOrDefaultAsync(o => o.OrderId == id && o.UserFirebaseUid == userId);

            if (order == null)
            {
                _logger.LogWarning("User {FirebaseUid} attempted to access non-existent or unauthorized Order {OrderId}", userId, id);
                return NotFound();
            }

            return Ok(order);
        }

        [HttpGet("all", Name = "GetAllOrdersAdmin")]
        public async Task<IActionResult> GetAllOrdersAdmin()
        {
            if (!IsAdminUser())
            {
                _logger.LogWarning("Non-admin user attempted to access GetAllOrdersAdmin.");
                return Forbid();
            }

            _logger.LogInformation("Admin user accessing all orders.");
            var allOrders = await _context.Orders
                                          .Include(o => o.OrderItems)
                                          .Include(o => o.User)
                                          .OrderBy(o => o.OrderTimestamp)
                                          .AsNoTracking()
                                          .ToListAsync();

            return Ok(allOrders);
        }

        public class UpdateOrderStatusDto
        {
            [Required]
            [MaxLength(50)]
            public string NewStatus { get; set; } = string.Empty;
        }

        [HttpPut("{id:int}/status", Name = "UpdateOrderStatusAdmin")]
        public async Task<IActionResult> UpdateOrderStatusAdmin(int id, [FromBody] UpdateOrderStatusDto statusDto)
        {
            if (!IsAdminUser())
            {
                _logger.LogWarning("Non-admin user attempted to update status for Order {OrderId}.", id);
                return Forbid();
            }

            var validStatuses = new[] { "Placed", "Preparing", "Ready for Pickup", "Completed", "Cancelled" };
            if (!validStatuses.Contains(statusDto.NewStatus, StringComparer.OrdinalIgnoreCase))
            {
                 return BadRequest($"Invalid status value: {statusDto.NewStatus}");
            }

            _logger.LogInformation("Admin user updating status for Order {OrderId} to {NewStatus}", id, statusDto.NewStatus);

            var order = await _context.Orders.FindAsync(id);

            if (order == null)
            {
                return NotFound($"Order with ID {id} not found.");
            }

            order.Status = statusDto.NewStatus;

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully updated status for Order {OrderId}", id);
                return NoContent();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                 _logger.LogError(ex, "Concurrency error updating status for Order {OrderId}", id);
                 return Conflict("The order was modified by another user. Please refresh and try again.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating status for Order {OrderId}", id);
                return StatusCode(500, "An internal error occurred while updating the order status.");
            }
        }

        private decimal CalculateDiscountFromServer(List<OrderItem> items, Dictionary<string, Product> products)
        {
            int loafCount = 0;
            decimal regularLoafPrice = 12.00m;

            if (products.TryGetValue("L001", out var regLoafProduct))
            {
                regularLoafPrice = regLoafProduct.Price;
            }
            else
            {
                var anyLoafProduct = products.Values.FirstOrDefault(p => p.Category.Equals("Loaf", StringComparison.OrdinalIgnoreCase));
                if (anyLoafProduct != null) regularLoafPrice = anyLoafProduct.Price;
            }

            foreach (var item in items)
            {
                if (products.ContainsKey(item.ProductId))
                {
                    if (products[item.ProductId].Category.Equals("Loaf", StringComparison.OrdinalIgnoreCase))
                    {
                        loafCount += item.Quantity;
                    }
                }
            }

            if (loafCount == 0 || regularLoafPrice == 0m) return 0m;

            decimal discountPerPair = (regularLoafPrice * 2) - 20.00m;
            if (discountPerPair < 0) discountPerPair = 0;

            int pairs = loafCount / 2;
            decimal totalDiscount = pairs * discountPerPair;

            _logger.LogInformation("Calculated discount: {TotalDiscount} for {LoafCount} loaves based on regular price {RegularLoafPrice}.", totalDiscount, loafCount, regularLoafPrice);
            return totalDiscount;
        }
    }
}
