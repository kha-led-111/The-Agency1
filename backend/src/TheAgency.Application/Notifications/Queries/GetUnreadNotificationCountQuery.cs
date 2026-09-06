using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Notifications.Queries;

public sealed record GetUnreadNotificationCountQuery(Guid UserId) : IRequest<int>;

public sealed class GetUnreadNotificationCountQueryHandler : IRequestHandler<GetUnreadNotificationCountQuery, int>
{
    private readonly IApplicationDbContext _context;

    public GetUnreadNotificationCountQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<int> Handle(GetUnreadNotificationCountQuery request, CancellationToken cancellationToken)
    {
        var count = await _context.Notifications
            .CountAsync(n => n.UserId == request.UserId && n.Status == NotificationStatus.Unread && !n.IsDeadLettered, cancellationToken);

        return count;
    }
}
