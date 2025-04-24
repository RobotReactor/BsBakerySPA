// BsBakerySPA.Server/Controllers/OrderController.cs
using Microsoft.AspNetCore.Mvc;
using BsBakerySPA.Server.Models;
using BsBakerySPA.Server.Data;
using Microsoft.AspNetCore.Authorization;
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

        public OrderController(ApplicationDbContext context, ILogger<OrderController> logger) // Updated constructor
        {
            _context = context;
            _logger = logger; // Assign logger
        }

        // --- DTOs for creating an order ---
        // Renamed OrderCreateDto for clarity
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
                // This check is good practice, though [Authorize] should prevent anonymous access
                _logger.LogWarning("CreateOrder called without valid Firebase UID in token.");
                return Unauthorized("User ID not found in token.");
            }

            _logger.LogInformation("Attempting to create order for user {FirebaseUid}", firebaseUid);

            // --- Server-Side Validation & Calculation ---
            var productIds = orderDto.Items.Select(i => i.ProductId).Distinct().ToList();

            // 1. Fetch products from DB to get current prices and validate IDs
            var productsFromDb = await _context.Products
                                               .Where(p => productIds.Contains(p.Id))
                                               .AsNoTracking() // Read-only query
                                               .ToDictionaryAsync(p => p.Id); // Use Dictionary for efficient lookup

            decimal calculatedSubtotal = 0m;
            var orderItems = new List<OrderItem>();

            foreach (var itemDto in orderDto.Items)
            {
                // 2. Validate Product ID and get price
                if (!productsFromDb.TryGetValue(itemDto.ProductId, out var product))
                {
                    _logger.LogWarning("CreateOrder: Invalid ProductId {ProductId} received for user {FirebaseUid}.", itemDto.ProductId, firebaseUid);
                    return BadRequest($"Product with ID '{itemDto.ProductId}' not found or unavailable.");
                }

                // TODO: Add validation for BagelDistribution counts if needed (e.g., ensure sum matches expected quantity)

                // 3. Create OrderItem entity
                var orderItem = new OrderItem
                {
                    ProductId = itemDto.ProductId,
                    Quantity = itemDto.Quantity,
                    PricePerItem = product.Price, // Use price from DB
                    // Serialize customization data to JSON strings for storage
                    SelectedToppingIdsJson = itemDto.SelectedToppingIds != null && itemDto.SelectedToppingIds.Any()
                                                ? JsonSerializer.Serialize(itemDto.SelectedToppingIds)
                                                : null,
                    BagelDistributionJson = itemDto.BagelDistribution != null && itemDto.BagelDistribution.Any()
                                                ? JsonSerializer.Serialize(itemDto.BagelDistribution)
                                                : null
                    // OrderId will be set by EF Core relationship
                };
                orderItems.Add(orderItem);

                // 4. Calculate subtotal based on DB price
                calculatedSubtotal += product.Price * itemDto.Quantity;
                // TODO: Add logic here if toppings have extra costs
            }

            // 5. Calculate Discount (Server-Side)
            decimal calculatedDiscount = CalculateDiscountFromServer(orderItems, productsFromDb); // Pass products for price info
            decimal calculatedTotal = calculatedSubtotal - calculatedDiscount;
            // --- End Server-Side Validation & Calculation ---


            // --- Create Order Entity ---
            var newOrder = new Order
            {
                UserFirebaseUid = firebaseUid, // Link to the logged-in user
                OrderTimestamp = DateTime.UtcNow,
                Status = "Placed", // Initial status
                OrderItems = orderItems, // Assign the validated items
                TotalAmount = calculatedTotal, // Use server-calculated total
                DiscountApplied = calculatedDiscount // Use server-calculated discount
            };

            // --- Save to Database ---
            try
            {
                _context.Orders.Add(newOrder);
                await _context.SaveChangesAsync(); // Save order and its items automatically due to relationship
                _logger.LogInformation("Successfully created Order {OrderId} for user {FirebaseUid}", newOrder.OrderId, firebaseUid);

                // Return 201 Created with the location/details of the new order
                // Consider creating an OrderResponseDto to return specific fields
                return CreatedAtRoute("GetOrderById", new { id = newOrder.OrderId }, newOrder); // Use route name
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
        [HttpGet("my", Name = "GetMyOrders")] // Added Name for potential CreatedAtRoute usage elsewhere
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
        [HttpGet("{id:int}", Name = "GetOrderById")] // Added :int constraint and Name
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
                _logger.LogWarning("User {FirebaseUid} attempted to access non-existent or unauthorized Order {OrderId}", userId, id);
                return NotFound();
            }

            // Optionally map to an Order DTO
            return Ok(order);
        }


        // --- Server-Side Discount Calculation Helper ---
        private decimal CalculateDiscountFromServer(List<OrderItem> items, Dictionary<string, Product> products)
        {
            // Find loaf items using the Product dictionary to get category/price info
            int loafCount = 0;
            decimal loafPrice = 0m; // Find the price of a standard loaf if needed

            foreach (var item in items)
            {
                if (products.TryGetValue(item.ProductId, out var product))
                {
                    if (product.Category.Equals("Loaf", StringComparison.OrdinalIgnoreCase))
                    {
                        loafCount += item.Quantity;
                        // Assuming L001 is the standard loaf for discount price reference
                        if (product.Id == "L001") loafPrice = product.Price;
                    }
                }
            }

            if (loafPrice == 0m)
            {
                // Attempt to get price if L001 wasn't in the order but other loaves were
                var anyLoafProduct = products.Values.FirstOrDefault(p => p.Category.Equals("Loaf", StringComparison.OrdinalIgnoreCase));
                if (anyLoafProduct != null) loafPrice = anyLoafProduct.Price;
                else return 0m; // No loaf price found, cannot calculate discount
            }

            // Calculate discount: $4 off for every pair of loaves (original price $12 each -> $20 for 2)
            decimal discountPerPair = (loafPrice * 2) - 20.00m;
            if (discountPerPair < 0) discountPerPair = 0; // Ensure discount isn't negative

            int pairs = loafCount / 2;
            decimal totalDiscount = pairs * discountPerPair;

            _logger.LogInformation("Calculated discount: {TotalDiscount} for {LoafCount} loaves.", totalDiscount, loafCount);
            return totalDiscount;
        }
    }
}