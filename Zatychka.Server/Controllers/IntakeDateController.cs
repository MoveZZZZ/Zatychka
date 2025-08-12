using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Zatychka.Server.Data;
using Zatychka.Server.Models;
using System.Text.Json.Serialization;

namespace Zatychka.Server.Controllers
{
    [Route("api/settings/intake-date")]
    [ApiController]
    public class IntakeDateController : ControllerBase
    {
        private readonly AppDbContext _db;
        public IntakeDateController(AppDbContext db) => _db = db;

        public class IntakeDateDto
        {
            [JsonConverter(typeof(JsonStringEnumConverter))]
            public IntakeDateMode Mode { get; set; } = IntakeDateMode.Actual;
            public DateTime? CustomDate { get; set; }
        }

        [HttpGet]
        [Authorize] 
        public async Task<IActionResult> Get()
        {
            var cfg = await _db.IntakeDateConfigs.AsNoTracking().FirstOrDefaultAsync(x => x.Id == 1);
            if (cfg == null) return Ok(new IntakeDateDto { Mode = IntakeDateMode.Actual, CustomDate = null });

            return Ok(new IntakeDateDto
            {
                Mode = cfg.Mode,
                CustomDate = cfg.CustomDate
            });
        }

        [HttpPut]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Save([FromBody] IntakeDateDto dto)
        {
            var cfg = await _db.IntakeDateConfigs.FirstOrDefaultAsync(x => x.Id == 1);
            if (cfg == null)
            {
                cfg = new IntakeDateConfig { Id = 1 };
                _db.IntakeDateConfigs.Add(cfg);
            }

            cfg.Mode = dto.Mode;
            cfg.CustomDate = dto.Mode == IntakeDateMode.Custom ? dto.CustomDate : null;
            cfg.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
