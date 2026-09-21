using System;
using System.Security.Claims;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TheAgency.Application.Identity.Common;
using TheAgency.Application.Identity.Queries.GetCurrentUser;

namespace TheAgency.API.Controllers;

public record UpdateProfileRequest(string? FirstName, string? LastName, string? PhoneNumber);

[ApiController]
[Route("api/me")]
[Authorize]
public class MeController : ControllerBase
{
    private readonly ISender _sender;

    public MeController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    [HttpGet("/api/users/me")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Get()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var result = await _sender.Send(new GetCurrentUserQuery(userId));
        return Ok(result);
    }

    [HttpPut]
    [HttpPut("profile")]
    [HttpPut("/api/users/profile")]
    [HttpPut("/api/profile")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var command = new TheAgency.Application.Identity.Commands.UpdateUserProfile.UpdateUserProfileCommand(
            userId,
            request.FirstName,
            request.LastName,
            request.PhoneNumber
        );

        var result = await _sender.Send(command);
        return Ok(result);
    }
}
