using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Notifications.Common;

namespace TheAgency.Application.Notifications.Queries;

public sealed record GetMyNotificationsQuery(Guid UserId) : IRequest<IReadOnlyList<NotificationDto>>;

public sealed class GetMyNotificationsQueryHandler : IRequestHandler<GetMyNotificationsQuery, IReadOnlyList<NotificationDto>>
{
    private readonly IApplicationDbContext _context;

    public GetMyNotificationsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<NotificationDto>> Handle(GetMyNotificationsQuery request, CancellationToken cancellationToken)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == request.UserId && !n.IsDeadLettered)
            .OrderByDescending(n => n.CreatedAtUtc)
            .Select(n => NotificationDto.From(n))
            .ToListAsync(cancellationToken);

        return notifications;
    }
}
