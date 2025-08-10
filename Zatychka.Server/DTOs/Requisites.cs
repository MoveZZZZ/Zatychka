namespace Zatychka.Server.DTOs
{
    public class AddRequisiteRequest
    {
        public string Type { get; set; } = null!;
        public string Value { get; set; } = null!;
    }

    public class UpdateRequisiteRequest
    {
        public string? Type { get; set; }
        public string? Value { get; set; }
    }

    public class RequisiteDto
    {
        public int Id { get; set; }
        public string Type { get; set; } = null!;
        public string Value { get; set; } = null!;
    }
}
