using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Notifications.Commands;

public sealed record MarkAllNotificationsAsReadCommand(Guid UserId) : IRequest<int>;

public sealed class MarkAllNotificationsAsReadCommandHandler : IRequestHandler<MarkAllNotificationsAsReadCommand, int>
{
    private readonly IApplicationDbContext _context;

    public MarkAllNotificationsAsReadCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<int> Handle(MarkAllNotificationsAsReadCommand request, CancellationToken cancellationToken)
    {
        var unreadNotifications = await _context.Notifications
            .Where(n => n.UserId == request.UserId && n.Status == NotificationStatus.Unread)
            .ToListAsync(cancellationToken);

        var now = DateTime.UtcNow;
        foreach (var notification in unreadNotifications)
        {
            notification.Status = NotificationStatus.Read;
            notification.ReadAtUtc = now;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return unreadNotifications.Count;
    }
}
