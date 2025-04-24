// Controllers/TestController.cs
using BsBakerySPA.Server.Data; // For ApplicationDbContext
using BsBakerySPA.Server.Models; // For TestModel
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; // For ToListAsync, AddAsync, SaveChangesAsync

namespace BsBakerySPA.Server.Controllers // Adjust namespace if needed
{
    [Route("api/[controller]")] // Route will be /api/test
    [ApiController]
    public class TestController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        // Inject the DbContext
        public TestController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/test
        // Gets all TestModel entries
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TestModel>>> GetTestModels()
        {
            // Retrieve all items from the TestModels table
            var items = await _context.TestModels.ToListAsync();
            return Ok(items); // Return 200 OK with the list of items
        }

        // POST: api/test
        // Creates a new TestModel entry
        [HttpPost]
        public async Task<ActionResult<TestModel>> PostTestModel([FromBody] TestModelCreateModel createModel)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState); // Return 400 Bad Request if input is invalid
            }

            // Create a new TestModel instance from the input
            var newTestModel = new TestModel
            {
                Name = createModel.Name // Map properties from the create model
                // CreatedAt is set by default in the model
            };

            // Add the new item to the DbContext
            _context.TestModels.Add(newTestModel);

            // Save changes to the database
            await _context.SaveChangesAsync();

            // Return 201 Created status with the created item and its location
            // The nameof(GetTestModelById) assumes you might add a GetById endpoint later
            // For simplicity now, we just return the created object directly.
            // You could enhance this later with CreatedAtAction.
            return CreatedAtAction(nameof(GetTestModels), new { id = newTestModel.Id }, newTestModel);
        }

        // --- Optional: Add a simple DTO (Data Transfer Object) for creation ---
        // This prevents overposting and clearly defines the expected input for POST
        public class TestModelCreateModel
        {
            public string? Name { get; set; }
        }

        // --- Optional but Recommended: Add a GET by ID endpoint ---
        // GET: api/test/5
        // [HttpGet("{id}")]
        // public async Task<ActionResult<TestModel>> GetTestModelById(int id)
        // {
        //     var testModel = await _context.TestModels.FindAsync(id);
        //
        //     if (testModel == null)
        //     {
        //         return NotFound(); // Return 404 Not Found if item doesn't exist
        //     }
        //
        //     return Ok(testModel); // Return 200 OK with the item
        // }
    }
}
