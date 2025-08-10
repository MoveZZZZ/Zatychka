// Controllers/SettingsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Zatychka.Server.Data;
using Zatychka.Server.Models;

[ApiController]
[Route("api/settings")]
public class SettingsController : ControllerBase
{
    private readonly AppDbContext _db;
    public SettingsController(AppDbContext db) => _db = db;

    // простая KV-таблица для настроек
    // DbSet<AppSetting> AppSettings в контексте
    // public class AppSetting { public int Id; public string Key=""; public string? Json; public DateTime UpdatedAt=DateTime.UtcNow; }

    // ---- TEXTS ----
    [HttpGet("statistics-texts")]
    public async Task<IActionResult> GetTexts()
    {
        var row = await _db.AppSettings.FirstOrDefaultAsync(x => x.Key == "statistics-texts");
        return Ok(row?.Json is null ? null : JsonSerializer.Deserialize<object>(row.Json));
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("statistics-texts")]
    public async Task<IActionResult> SaveTexts([FromBody] object payload)
    {
        var json = JsonSerializer.Serialize(payload);
        var row = await _db.AppSettings.FirstOrDefaultAsync(x => x.Key == "statistics-texts");
        if (row == null)
        {
            row = new AppSetting { Key = "statistics-texts", Json = json };
            _db.AppSettings.Add(row);
        }
        else
        {
            row.Json = json;
            row.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
        return Ok(payload);
    }

    // ---- NUMBERS ----
    [HttpGet("statistics-numbers")]
    public async Task<IActionResult> GetNumbers()
    {
        var row = await _db.AppSettings.FirstOrDefaultAsync(x => x.Key == "statistics-numbers");
        return Ok(row?.Json is null ? null : JsonSerializer.Deserialize<object>(row.Json));
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("statistics-numbers")]
    public async Task<IActionResult> SaveNumbers([FromBody] object payload)
    {
        var json = JsonSerializer.Serialize(payload);
        var row = await _db.AppSettings.FirstOrDefaultAsync(x => x.Key == "statistics-numbers");
        if (row == null)
        {
            row = new AppSetting { Key = "statistics-numbers", Json = json };
            _db.AppSettings.Add(row);
        }
        else
        {
            row.Json = json;
            row.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
        return Ok(payload);
    }
}
