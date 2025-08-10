namespace Zatychka.Server.DTOs
{
    public class CreateOwnerRequest
    {
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string? MiddleName { get; set; }
        public string BankName { get; set; } = null!;
    }

    public class UpdateOwnerRequest
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? MiddleName { get; set; }
        public string? BankName { get; set; }
    }

    public class OwnerDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string? MiddleName { get; set; }
        public string BankName { get; set; } = null!;
        public List<RequisiteDto> Requisites { get; set; } = new();
    }
}
