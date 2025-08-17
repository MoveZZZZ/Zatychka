// Services/TronDepositService.cs
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Zatychka.Server.Data;
using Zatychka.Server.Models;

namespace Zatychka.Server.Services
{
    // DTO под TronGrid v1
    file sealed class Trc20Tx
    {
        public string transaction_id { get; set; } = default!;
        public string from { get; set; } = default!;
        public string to { get; set; } = default!;
        public string contract_address { get; set; } = default!;
        public string value { get; set; } = default!; // как BigInt в строке
        public long block_timestamp { get; set; }      // ms
        public TokenInfo token_info { get; set; } = new();
        public sealed class TokenInfo { public int decimals { get; set; } = 6; public string symbol { get; set; } = "USDT"; }
    }

    file sealed class Trc20Resp { public List<Trc20Tx>? data { get; set; } }

    public sealed class TronDepositService : ITronDepositService
    {
        private readonly AppDbContext _db;
        private readonly IHttpClientFactory _httpFactory;

        private const string UsdtContract = "TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj";

        public TronDepositService(AppDbContext db, IHttpClientFactory httpFactory)
        {
            _db = db;
            _httpFactory = httpFactory;
        }

        public async Task<IReadOnlyList<ProcessedDeposit>> CheckAndSaveAsync(
            string tronAddress,
            int? userId = null,
            CancellationToken ct = default)
        {
            tronAddress = tronAddress?.Trim() ?? throw new ArgumentNullException(nameof(tronAddress));
            if (string.IsNullOrWhiteSpace(tronAddress)) throw new ArgumentException("Empty address");

            var http = _httpFactory.CreateClient("trongrid");

            var url = $"v1/accounts/{tronAddress}/transactions/trc20?only_to=true&limit=50&contract_address={UsdtContract}";
            var resp = await http.GetFromJsonAsync<Trc20Resp>(url, ct);
            var list = resp?.data ?? new();

 
            var cursor = await _db.DepositCursors.FirstOrDefaultAsync(x => x.Address == tronAddress, ct)
                         ?? new DepositCursor { Address = tronAddress };


            if (!string.IsNullOrEmpty(cursor.LastTxId))
            {
                var idx = list.FindIndex(t => t.transaction_id == cursor.LastTxId);
                if (idx >= 0) list = list.Take(idx).ToList();
            }


            if (list.Count == 0) return Array.Empty<ProcessedDeposit>();


            list.Reverse();


            decimal current = await _db.BalanceChanges
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.Date)
                .Select(b => b.BalanceAfter)
                .FirstOrDefaultAsync(ct);

            var processed = new List<ProcessedDeposit>(list.Count);

            foreach (var t in list)
            {
                // только на наш адрес и только USDT
                if (!string.Equals(t.to, tronAddress, StringComparison.OrdinalIgnoreCase)) continue;
                if (!string.Equals(t.contract_address, UsdtContract, StringComparison.OrdinalIgnoreCase)) continue;

                var decimals = t.token_info?.decimals is > 0 ? t.token_info.decimals : 6;
                if (!System.Numerics.BigInteger.TryParse(t.value, out var raw)) continue;
                var amount = (decimal)raw / (decimal)Math.Pow(10, decimals);

                var when = DateTimeOffset.FromUnixTimeMilliseconds(t.block_timestamp).UtcDateTime;

                var before = current;
                var after = before + amount;

                _db.BalanceChanges.Add(new BalanceChange
                {
                    UserId = userId,                 
                    Date = when,
                    Type = BalanceChangeType.Deposit,
                    Amount = Math.Round(amount, 2),    
                    BalanceBefore = Math.Round(before, 2),
                    BalanceAfter = Math.Round(after, 2)
                });

                current = after;

                processed.Add(new ProcessedDeposit(
                    t.transaction_id, Math.Round(amount, 6), when, t.from));
            }

            var newest = list.Last();
            cursor.LastTxId = newest.transaction_id;
            cursor.LastBlockTimestamp = newest.block_timestamp;

            if (cursor.Id == 0) _db.DepositCursors.Add(cursor);

            await _db.SaveChangesAsync(ct);
            return processed;
        }
    }
}
