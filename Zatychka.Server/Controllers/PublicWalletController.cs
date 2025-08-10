// Controllers/WalletController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Zatychka.Server.Data;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/wallet")]
public class PublicWalletController : ControllerBase
{
    private readonly AppDbContext _db;
    public PublicWalletController(AppDbContext db) { _db = db; }

    public class PublicWalletDto
    {
        public decimal? MainUsdt { get; set; }
        public decimal? FrozenUsdt { get; set; }
    }

    [HttpGet("public")]
    [Authorize] 
    public async Task<IActionResult> GetPublic()
    {
        var row = await _db.PublicWallets.FirstOrDefaultAsync();
        if (row == null)
        {
            row = new PublicWallet { MainUsdt = 0, FrozenUsdt = 0, UpdatedAt = DateTime.UtcNow };
            _db.PublicWallets.Add(row);
            await _db.SaveChangesAsync();
        }

        return Ok(new
        {
            mainUsdt = row.MainUsdt,
            frozenUsdt = row.FrozenUsdt,
            updatedAt = row.UpdatedAt
        });
    }

    [HttpPut("public")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> SavePublic([FromBody] PublicWalletDto dto)
    {
        var row = await _db.PublicWallets.FirstOrDefaultAsync();
        if (row == null)
        {
            row = new PublicWallet();
            _db.PublicWallets.Add(row);
        }

        if (dto.MainUsdt.HasValue) row.MainUsdt = dto.MainUsdt.Value;
        if (dto.FrozenUsdt.HasValue) row.FrozenUsdt = dto.FrozenUsdt.Value;
        row.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            mainUsdt = row.MainUsdt,
            frozenUsdt = row.FrozenUsdt,
            updatedAt = row.UpdatedAt
        });
    }
}
