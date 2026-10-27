namespace RestaurantAPI.Models.DTOs;

// UC-59: Restaurant Information DTO
public class RestaurantInfoDto
{
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string? OpeningHours { get; set; }
    public string? Description { get; set; }
    public string? FacebookUrl { get; set; }
    public string? InstagramUrl { get; set; }
    public string? LogoUrl { get; set; }
    public string? TaxCode { get; set; }
    public string? BankAccount { get; set; }
}
