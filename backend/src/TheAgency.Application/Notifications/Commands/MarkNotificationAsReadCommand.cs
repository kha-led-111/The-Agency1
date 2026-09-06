using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Notifications.Common;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Notifications.Commands;

public sealed record MarkNotificationAsReadCommand(
    Guid NotificationId,
    Guid RequestUserId
) : IRequest<NotificationDto>;

public sealed class MarkNotificationAsReadCommandHandler : IRequestHandler<MarkNotificationAsReadCommand, NotificationDto>
{
    private readonly IApplicationDbContext _context;

    public MarkNotificationAsReadCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<NotificationDto> Handle(MarkNotificationAsReadCommand request, CancellationToken cancellationToken)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == request.NotificationId, cancellationToken);

        if (notification is null)
        {
            throw new NotFoundException("Notification was not found.");
        }

        if (notification.UserId != request.RequestUserId)
        {
            throw new UnauthorizedException("You do not have permission to modify this notification.");
        }

        notification.Status = NotificationStatus.Read;
        notification.ReadAtUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return NotificationDto.From(notification);
    }
}
