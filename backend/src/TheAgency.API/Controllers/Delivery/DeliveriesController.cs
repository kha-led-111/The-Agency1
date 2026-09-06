using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TheAgency.Application.Delivery.Commands.AssignDelivery;
using TheAgency.Application.Delivery.Commands.UpdateDeliveryStatus;
using TheAgency.Application.Delivery.Common;
using TheAgency.Application.Delivery.Queries.GetDeliveryTaskById;
using TheAgency.Application.Delivery.Queries.GetDeliveryTrackingEvents;
using TheAgency.Domain.Enums;

namespace TheAgency.API.Controllers.Delivery;

[ApiController]
[Route("api/deliveries")]
[Authorize]
public class DeliveriesController : ControllerBase
{
    private readonly ISender _sender;

    public DeliveriesController(ISender sender)
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

    private UserRole GetCurrentUserRole()
    {
        var roleStr = User.FindFirstValue(ClaimTypes.Role);
        if (Enum.TryParse<UserRole>(roleStr, ignoreCase: true, out var role))
        {
            return role;
        }
        return UserRole.Buyer;
    }

    [HttpPost("assign")]
    [ProducesResponseType(typeof(DeliveryTaskDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AssignDelivery(
        [FromBody] AssignDeliveryRequest request,
        CancellationToken cancellationToken)
    {
        var command = new AssignDeliveryCommand(request.OrderId, request.CourierId);
        var task = await _sender.Send(command, cancellationToken);
        return Ok(task);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(DeliveryTaskDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDeliveryById(Guid id, CancellationToken cancellationToken)
    {
        var task = await _sender.Send(new GetDeliveryTaskByIdQuery(id), cancellationToken);
        return Ok(task);
    }

    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(DeliveryTaskDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateDeliveryStatus(
        Guid id,
        [FromBody] UpdateDeliveryStatusRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var userRole = GetCurrentUserRole();
        var command = new UpdateDeliveryTaskStatusCommand(
            id,
            userId,
            userRole,
            request.Status,
            request.Note,
            request.FailureReason
        );
        var task = await _sender.Send(command, cancellationToken);
        return Ok(task);
    }

    [HttpGet("{id:guid}/tracking")]
    [ProducesResponseType(typeof(IReadOnlyList<DeliveryTrackingEventDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTrackingEvents(Guid id, CancellationToken cancellationToken)
    {
        var events = await _sender.Send(new GetDeliveryTrackingEventsQuery(id), cancellationToken);
        return Ok(events);
    }
}

public sealed record AssignDeliveryRequest(Guid OrderId, Guid? CourierId = null);
public sealed record UpdateDeliveryStatusRequest(DeliveryStatus Status, string? Note = null, string? FailureReason = null);
