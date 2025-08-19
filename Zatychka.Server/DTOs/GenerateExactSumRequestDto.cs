namespace Zatychka.Server.DTOs
{
    public class GenerateExactSumRequestDto
    {
        public DateTime Date { get; set; }
        public int Count { get; set; }
        public decimal MinAmount { get; set; }
        public decimal MaxAmount { get; set; }
        public decimal TotalAmount { get; set; }
    }
}