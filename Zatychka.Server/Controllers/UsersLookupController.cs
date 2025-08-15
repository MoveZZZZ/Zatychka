using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Zatychka.Server.Data;

[Route("api/users")]
[ApiController]
public class UsersLookupController : ControllerBase
{
    private readonly AppDbContext _db;
    public UsersLookupController(AppDbContext db) => _db = db;

    [HttpGet("lookup")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Lookup([FromQuery] string? login, [FromQuery] int take = 20)
    {
        login ??= "";
        var list = await _db.Users.Where(u => u.Login.Contains(login))
            .OrderBy(u => u.Login).Take(Math.Clamp(take, 1, 100))
            .Select(u => new { id = u.Id, login = u.Login, email = u.Email })
            .ToListAsync();
        return Ok(list);
    }
}
