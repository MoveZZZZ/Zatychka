namespace Zatychka.Server.Settings
{
    public class TokenSettings
    {
        public string Secret { get; set; } = null!;   
        public string Issuer { get; set; } = null!;   
        public string Audience { get; set; } = null!; 
    }
}
