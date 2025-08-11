using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using System.Net.Http;
using System.Text.Json;

namespace Zatychka.Server.Controllers
{
    [ApiController]
    [Route("api/rates")]
    public class RatesController : ControllerBase
    {
        private readonly IHttpClientFactory _http;
        private readonly IMemoryCache _cache;
        private readonly ILogger<RatesController> _logger;

        public RatesController(IHttpClientFactory http, IMemoryCache cache, ILogger<RatesController> logger)
        {
            _http = http;
            _cache = cache;
            _logger = logger;
        }

        [HttpGet("usdt-rub")]
        public async Task<IActionResult> GetUsdtRub()
        {
            try
            {
                var client = _http.CreateClient();
                using var req = new HttpRequestMessage(HttpMethod.Get,
                    "https://api.coinbase.com/v2/exchange-rates?currency=USDT");

                req.Headers.TryAddWithoutValidation("Accept", "application/json");
                req.Headers.TryAddWithoutValidation("User-Agent", "ZatychkaServer/1.0");

                using var res = await client.SendAsync(req);
                res.EnsureSuccessStatusCode();

                using var stream = await res.Content.ReadAsStreamAsync();
                using var doc = await JsonDocument.ParseAsync(stream);
                var root = doc.RootElement;

                var rubStr = root.GetProperty("data").GetProperty("rates").GetProperty("RUB").GetString();
                if (rubStr == null) return StatusCode(502, "Coinbase: RUB not found");

                if (!decimal.TryParse(rubStr, System.Globalization.NumberStyles.Any,
                        System.Globalization.CultureInfo.InvariantCulture, out var rate))
                {
                    return StatusCode(502, "Coinbase: parse failed");
                }
                var rounded = Math.Round(rate, 2, MidpointRounding.AwayFromZero);

                return Ok(new { rate = rounded, source = "coinbase", cached = false });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch USDT/RUB from Coinbase");
                return StatusCode(502, "Failed to fetch rate");
            }
        }
    }
}
