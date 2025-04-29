using BsBakerySPA.Server.Data;
using BsBakerySPA.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BsBakerySPA.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TestController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TestController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TestModel>>> GetTestModels()
        {
            var items = await _context.TestModels.ToListAsync();
            return Ok(items);
        }

        [HttpPost]
        public async Task<ActionResult<TestModel>> PostTestModel([FromBody] TestModelCreateModel createModel)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var newTestModel = new TestModel
            {
                Name = createModel.Name
            };

            _context.TestModels.Add(newTestModel);

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTestModels), new { id = newTestModel.Id }, newTestModel);
        }

        public class TestModelCreateModel
        {
            public string? Name { get; set; }
        }

    }
}
