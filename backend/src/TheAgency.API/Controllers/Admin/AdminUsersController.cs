using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TheAgency.Application.Admin.Commands.DeleteUser;
using TheAgency.Application.Admin.Commands.ToggleUserStatus;
using TheAgency.Application.Admin.Commands.UpdateUserRole;
using TheAgency.Application.Admin.Queries.GetUsers;
using TheAgency.Application.Identity.Common;
using TheAgency.Domain.Enums;

namespace TheAgency.API.Controllers.Admin;

public record UpdateRoleRequest(UserRole Role);
public record ToggleStatusRequest(bool IsActive);

[ApiController]
[Route("api/admin/users")]
[Authorize(Policy = "AdminOnly")]
public class AdminUsersController : ControllerBase
{
    private readonly ISender _sender;

    public AdminUsersController(ISender sender)
    {
        _sender = sender;
    }

    private Guid GetCurrentUserId()
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(idStr, out var userId))
        {
            throw new UnauthorizedAccessException("Admin user is not authenticated.");
        }
        return userId;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<UserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] UserRole? role,
        [FromQuery] bool? isActive,
        CancellationToken cancellationToken)
    {
        var query = new GetUsersForAdminQuery(search, role, isActive);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{userId:guid}/role")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateRole(Guid userId, [FromBody] UpdateRoleRequest request, CancellationToken cancellationToken)
    {
        var command = new UpdateUserRoleCommand(userId, request.Role);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{userId:guid}/status")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleStatus(Guid userId, [FromBody] ToggleStatusRequest request, CancellationToken cancellationToken)
    {
        var command = new ToggleUserStatusCommand(userId, request.IsActive);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{userId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteUser(Guid userId, CancellationToken cancellationToken)
    {
        var adminId = GetCurrentUserId();
        await _sender.Send(new AdminDeleteUserCommand(userId, adminId), cancellationToken);
        return Ok(new { success = true });
    }
}
