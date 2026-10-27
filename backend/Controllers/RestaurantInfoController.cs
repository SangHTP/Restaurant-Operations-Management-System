using Microsoft.AspNetCore.Mvc;
using RestaurantAPI.Models.DTOs;

namespace RestaurantAPI.Controllers;

[ApiController]
[Route("api/restaurant-info")]
public class RestaurantInfoController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public RestaurantInfoController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    /// <summary>UC-59: View public restaurant information.</summary>
    [HttpGet]
    [ProducesResponseType<RestaurantInfoDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public ActionResult<RestaurantInfoDto> GetRestaurantInfo()
    {
        var info = _configuration.GetSection("RestaurantInfo").Get<RestaurantInfoDto>();
        if (info == null || string.IsNullOrWhiteSpace(info.Name)
            || string.IsNullOrWhiteSpace(info.Address)
            || string.IsNullOrWhiteSpace(info.Phone))
        {
            return Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Restaurant information is not configured.",
                detail: "Configure RestaurantInfo with Name, Address, and Phone before requesting this endpoint.");
        }

        info.TaxCode = null;
        info.BankAccount = null;
        return Ok(info);
    }
}
