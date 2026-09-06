using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TheAgency.Application.Delivery.Commands.OnboardCourier;
using TheAgency.Application.Delivery.Commands.UpdateAvailability;
using TheAgency.Application.Delivery.Common;
using TheAgency.Application.Delivery.Queries.GetCourierProfile;

namespace TheAgency.API.Controllers.Delivery;

[ApiController]
[Route("api/couriers")]
[Authorize]
public class CouriersController : ControllerBase
{
    private readonly ISender _sender;

    public CouriersController(ISender sender)
    {
        _sender = sender;
    }

    private Guid GetCurrentUserId()
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(idStr, out var userId))
        {
            throw new UnauthorizedAccessException("User is not authenticated.");
        }
        return userId;
    }

    [HttpPost("onboard")]
    [ProducesResponseType(typeof(CourierProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> OnboardCourier(
        [FromBody] OnboardCourierRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new OnboardCourierCommand(userId, request.VehicleType, request.DeliveryZone);
        var profile = await _sender.Send(command, cancellationToken);
        return Ok(profile);
    }

    [HttpGet("profile")]
    [ProducesResponseType(typeof(CourierProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyProfile(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var profile = await _sender.Send(new GetCourierProfileQuery(userId), cancellationToken);
        return Ok(profile);
    }

    [HttpPatch("availability")]
    [ProducesResponseType(typeof(CourierProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAvailability(
        [FromBody] UpdateAvailabilityRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new UpdateCourierAvailabilityCommand(userId, request.IsAvailable);
        var profile = await _sender.Send(command, cancellationToken);
        return Ok(profile);
    }
}

public sealed record OnboardCourierRequest(string VehicleType, string DeliveryZone);
public sealed record UpdateAvailabilityRequest(bool IsAvailable);
