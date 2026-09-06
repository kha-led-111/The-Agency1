using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TheAgency.Application.Notifications.Commands;
using TheAgency.Application.Notifications.Common;
using TheAgency.Application.Notifications.Queries;

namespace TheAgency.API.Controllers.Notifications;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly ISender _sender;

    public NotificationsController(ISender sender)
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

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<NotificationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyNotifications(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var notifications = await _sender.Send(new GetMyNotificationsQuery(userId), cancellationToken);
        return Ok(notifications);
    }

    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnreadCount(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var count = await _sender.Send(new GetUnreadNotificationCountQuery(userId), cancellationToken);
        return Ok(count);
    }

    [HttpPatch("{id:guid}/read")]
    [ProducesResponseType(typeof(NotificationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var notification = await _sender.Send(new MarkNotificationAsReadCommand(id, userId), cancellationToken);
        return Ok(notification);
    }

    [HttpPost("read-all")]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var count = await _sender.Send(new MarkAllNotificationsAsReadCommand(userId), cancellationToken);
        return Ok(count);
    }

    [HttpPost("process-retries")]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    public async Task<IActionResult> ProcessRetries(CancellationToken cancellationToken)
    {
        var count = await _sender.Send(new ProcessNotificationRetriesCommand(), cancellationToken);
        return Ok(count);
    }
}
