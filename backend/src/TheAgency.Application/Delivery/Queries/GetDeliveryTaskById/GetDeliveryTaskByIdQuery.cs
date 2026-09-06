using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Delivery.Common;

namespace TheAgency.Application.Delivery.Queries.GetDeliveryTaskById;

public sealed record GetDeliveryTaskByIdQuery(Guid DeliveryTaskId) : IRequest<DeliveryTaskDto>;

public sealed class GetDeliveryTaskByIdQueryHandler : IRequestHandler<GetDeliveryTaskByIdQuery, DeliveryTaskDto>
{
    private readonly IApplicationDbContext _context;

    public GetDeliveryTaskByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DeliveryTaskDto> Handle(GetDeliveryTaskByIdQuery request, CancellationToken cancellationToken)
    {
        var task = await _context.DeliveryTasks
            .Include(d => d.TrackingEvents)
            .FirstOrDefaultAsync(d => d.Id == request.DeliveryTaskId, cancellationToken);

        if (task is null)
        {
            throw new NotFoundException("Delivery task was not found.");
        }

        return DeliveryTaskDto.From(task);
    }
}
