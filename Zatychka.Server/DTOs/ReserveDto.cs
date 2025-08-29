namespace Zatychka.Server.DTOs
{
    public class ReserveDto
    {
        public string Scope { get; set; }
        public decimal Amount { get; set; }
        public string UpdatedAtUtc { get; set; }

        public ReserveDto(string scope, decimal amount, string updatedAtUtc)
        {
            Scope = scope;
            Amount = amount;
            UpdatedAtUtc = updatedAtUtc;
        }

        public ReserveDto() { } // для сериализатора
    }
}
