using Zatychka.Server.Models;

namespace Zatychka.Server.Services
{
    public record ProcessedDeposit(string TxId, decimal Amount, DateTime Utc, string From);

    public interface ITronDepositService
    {
        Task<IReadOnlyList<ProcessedDeposit>> CheckAndSaveAsync(
            string tronAddress,
            int? userId = null,
            CancellationToken ct = default);
    }
}
