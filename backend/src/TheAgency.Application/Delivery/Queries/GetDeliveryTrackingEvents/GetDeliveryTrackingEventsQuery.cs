using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Delivery.Common;

namespace TheAgency.Application.Delivery.Queries.GetDeliveryTrackingEvents;

public sealed record GetDeliveryTrackingEventsQuery(Guid DeliveryTaskId) : IRequest<IReadOnlyList<DeliveryTrackingEventDto>>;

public sealed class GetDeliveryTrackingEventsQueryHandler : IRequestHandler<GetDeliveryTrackingEventsQuery, IReadOnlyList<DeliveryTrackingEventDto>>
{
    private readonly IApplicationDbContext _context;

    public GetDeliveryTrackingEventsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<DeliveryTrackingEventDto>> Handle(GetDeliveryTrackingEventsQuery request, CancellationToken cancellationToken)
    {
        var events = await _context.DeliveryTrackingEvents
            .Where(e => e.DeliveryTaskId == request.DeliveryTaskId)
            .OrderBy(e => e.TimestampUtc)
            .Select(e => DeliveryTrackingEventDto.From(e))
            .ToListAsync(cancellationToken);

        return events;
    }
}
