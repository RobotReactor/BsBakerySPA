// BsBakerySPA.Server/Controllers/OrderController.cs
using BsBakerySPA.Server.Models;
using BsBakerySPA.Server.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging; // Added for logging
using System.ComponentModel.DataAnnotations;
using System.Text.Json; // Added for JSON handling

namespace BsBakerySPA.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Require authentication for all order actions
    public class OrderController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<OrderController> _logger; // Inject Logger

        // --- Define Admin UIDs (Should match frontend/config) ---
        // CRITICAL: Replace with actual admin Firebase UIDs if not done already
        private static readonly List<string> AdminUserIds = new List<string> {
            "XKE46g6IuBNZSYDyfbPLDMILfwq1", // Example UID
            "lujtPx1DerXyqicnWXwOiJI3JSK2"  // Example UID
        };
        // ---

        public OrderController(ApplicationDbContext context, ILogger<OrderController> logger) // Updated constructor
        {
            _context = context;
            _logger = logger; // Assign logger
        }

        // Helper to check if the current user is an admin
        private bool IsAdminUser()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return !string.IsNullOrEmpty(userId) && AdminUserIds.Contains(userId);
            // TODO: Replace with claim check: return User.HasClaim("admin", "true");
        }

        // --- DTOs for creating an order ---
        public class CreateOrderRequestDto
        {
            [Required]
            [MinLength(1, ErrorMessage = "Order must contain at least one item.")]
            public List<CreateOrderItemDto> Items { get; set; } = new List<CreateOrderItemDto>();
            // Add other fields if needed (e.g., shipping info)
        }

        public class CreateOrderItemDto
        {
            [Required]
            public string ProductId { get; set; } = string.Empty;

            [Range(1, 100, ErrorMessage = "Quantity must be between 1 and 100.")]
            public int Quantity { get; set; }

            // Receive customization data from the client
            public List<string>? SelectedToppingIds { get; set; } // For simple topping selection (if used)
            public Dictionary<string, int>? BagelDistribution { get; set; } // For detailed bagel counts
        }
        // --- End DTOs ---


        // POST /api/order (Create a new order)
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

            // --- Fetch ALL potentially needed data upfront ---
            var productIds = orderDto.Items.Select(i => i.ProductId).Distinct().ToList();
            var productsFromDb = await _context.Products
                                               .Where(p => productIds.Contains(p.Id))
                                               .AsNoTracking()
                                               .ToDictionaryAsync(p => p.Id);

            // Get all possible topping IDs mentioned in the order
            var allToppingIds = orderDto.Items
                                        .Where(i => i.SelectedToppingIds != null)
                                        .SelectMany(i => i.SelectedToppingIds!) // Use null-forgiving operator
                                        .Distinct()
                                        .ToList();

            // Fetch relevant toppings from DB
            var toppingsFromDb = await _context.BagelToppings
                                               .Where(t => allToppingIds.Contains(t.Id))
                                               .AsNoTracking()
                                               .ToDictionaryAsync(t => t.Id);
            // --- End data fetching ---


            decimal calculatedSubtotal = 0m; // This will be the final total for the order line items
            var orderItems = new List<OrderItem>();

            foreach (var itemDto in orderDto.Items)
            {
                if (!productsFromDb.TryGetValue(itemDto.ProductId, out var product))
                {
                    _logger.LogWarning("CreateOrder: Invalid ProductId {ProductId} received for user {FirebaseUid}.", itemDto.ProductId, firebaseUid);
                    return BadRequest($"Product with ID '{itemDto.ProductId}' not found or unavailable.");
                }

                // --- Calculate Topping Cost for this item ---
                decimal currentItemToppingCost = 0m;
                // Use SelectedToppingIds if available (for bagels)
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
                            // Return BadRequest if an invalid topping ID is critical
                            // return BadRequest($"Invalid topping ID '{toppingId}' found.");
                        }
                    }
                }
                // --- End Topping Cost Calculation ---

                // --- Calculate final price for THIS item ---
                decimal finalItemPrice = product.Price + currentItemToppingCost;
                // ---

                var orderItem = new OrderItem
                {
                    ProductId = itemDto.ProductId,
                    Quantity = itemDto.Quantity,
                    PricePerItem = finalItemPrice, // <-- Use the final calculated price
                    SelectedToppingIdsJson = itemDto.SelectedToppingIds != null && itemDto.SelectedToppingIds.Any()
                                                ? JsonSerializer.Serialize(itemDto.SelectedToppingIds)
                                                : null,
                    BagelDistributionJson = itemDto.BagelDistribution != null && itemDto.BagelDistribution.Any()
                                                ? JsonSerializer.Serialize(itemDto.BagelDistribution)
                                                : null
                };
                orderItems.Add(orderItem);

                // --- Add this item's total cost to the overall subtotal ---
                calculatedSubtotal += finalItemPrice * itemDto.Quantity;
                // ---
            }

            // Calculate Discount (Server-Side)
            decimal calculatedDiscount = CalculateDiscountFromServer(orderItems, productsFromDb);
            decimal calculatedTotal = calculatedSubtotal - calculatedDiscount; // Subtotal already includes toppings

            var newOrder = new Order
            {
                UserFirebaseUid = firebaseUid,
                OrderTimestamp = DateTime.UtcNow,
                Status = "Placed",
                OrderItems = orderItems,
                TotalAmount = calculatedTotal, // Use final total
                DiscountApplied = calculatedDiscount
            };

            try
            {
                _context.Orders.Add(newOrder);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully created Order {OrderId} for user {FirebaseUid}", newOrder.OrderId, firebaseUid);

                // Return DTO recommended here instead of the full newOrder object
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


        // GET /api/order/my (Get orders for the logged-in user)
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
                                       .Include(o => o.OrderItems) // Include related items
                                       .OrderByDescending(o => o.OrderTimestamp) // Show newest first
                                       .AsNoTracking() // Read-only
                                       .ToListAsync();

            // Optionally map to Order DTOs before returning
            return Ok(orders);
        }

        // GET /api/order/{id} (Get a specific order by ID)
        [HttpGet("{id:int}", Name = "GetOrderById")]
        public async Task<IActionResult> GetOrderById(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token.");
            }

            var order = await _context.Orders
                                      .Include(o => o.OrderItems) // Eager load items
                                      .AsNoTracking()
                                      .FirstOrDefaultAsync(o => o.OrderId == id && o.UserFirebaseUid == userId); // Ensure user owns the order

            if (order == null)
            {
                // Allow admin to fetch any order by ID if needed, otherwise keep user check
                // if (!IsAdminUser()) return NotFound();
                // order = await _context.Orders... // Fetch without user check if admin
                _logger.LogWarning("User {FirebaseUid} attempted to access non-existent or unauthorized Order {OrderId}", userId, id);
                return NotFound();
            }

            // Optionally map to an Order DTO
            return Ok(order);
        }


        // --- NEW: GET /api/order/all (Admin Only) ---
        [HttpGet("all", Name = "GetAllOrdersAdmin")]
        public async Task<IActionResult> GetAllOrdersAdmin()
        {
            if (!IsAdminUser())
            {
                _logger.LogWarning("Non-admin user attempted to access GetAllOrdersAdmin.");
                return Forbid(); // Or Unauthorized()
            }

            _logger.LogInformation("Admin user accessing all orders.");
            var allOrders = await _context.Orders
                                          .Include(o => o.OrderItems) // Include items
                                          .Include(o => o.User) // Include user info (optional)
                                          .OrderBy(o => o.OrderTimestamp) // Earliest first
                                          .AsNoTracking()
                                          .ToListAsync();

            // Consider mapping to DTOs here as well, especially if including User info
            return Ok(allOrders);
        }

        // --- NEW: PUT /api/order/{id}/status (Admin Only) ---
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

            // Validate the new status if needed (e.g., ensure it's one of predefined values)
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

            order.Status = statusDto.NewStatus; // Update the status

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully updated status for Order {OrderId}", id);
                return NoContent(); // Success, no content to return
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


        // --- Discount Calculation Helper ---
        private decimal CalculateDiscountFromServer(List<OrderItem> items, Dictionary<string, Product> products)
        {
            int loafCount = 0;
            decimal regularLoafPrice = 12.00m; // Default price for L001

            // Try to get the actual price of L001 if it's available in the fetched products
            if (products.TryGetValue("L001", out var regLoafProduct))
            {
                regularLoafPrice = regLoafProduct.Price;
            }
            else
            {
                // Fallback if L001 wasn't ordered but other loaves were, use the first loaf price found
                var anyLoafProduct = products.Values.FirstOrDefault(p => p.Category.Equals("Loaf", StringComparison.OrdinalIgnoreCase));
                if (anyLoafProduct != null) regularLoafPrice = anyLoafProduct.Price;
                // If still 0, we can't calculate discount based on L001 price
            }


            foreach (var item in items)
            {
                // Check if the product exists in our fetched dictionary
                if (products.ContainsKey(item.ProductId))
                {
                    // Check if the product is a Loaf
                    if (products[item.ProductId].Category.Equals("Loaf", StringComparison.OrdinalIgnoreCase))
                    {
                        loafCount += item.Quantity;
                    }
                }
            }

            // If no loaves or no price reference, no discount
            if (loafCount == 0 || regularLoafPrice == 0m) return 0m;

            // Calculate discount: $4 off for every pair of loaves (based on $12 regular price -> $20 for 2)
            decimal discountPerPair = (regularLoafPrice * 2) - 20.00m; // e.g., ($12 * 2) - $20 = $4
            if (discountPerPair < 0) discountPerPair = 0; // Ensure discount isn't negative

            int pairs = loafCount / 2;
            decimal totalDiscount = pairs * discountPerPair;

            _logger.LogInformation("Calculated discount: {TotalDiscount} for {LoafCount} loaves based on regular price {RegularLoafPrice}.", totalDiscount, loafCount, regularLoafPrice);
            return totalDiscount;
        }
    }
}