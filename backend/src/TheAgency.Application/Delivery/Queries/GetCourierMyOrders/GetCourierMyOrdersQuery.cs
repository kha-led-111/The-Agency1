using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Orders.Common;

namespace TheAgency.Application.Delivery.Queries.GetCourierMyOrders;

public sealed record GetCourierMyOrdersQuery(Guid CourierUserId) : IRequest<IReadOnlyList<OrderDto>>;

public sealed class GetCourierMyOrdersQueryHandler : IRequestHandler<GetCourierMyOrdersQuery, IReadOnlyList<OrderDto>>
{
    private readonly IApplicationDbContext _context;

    public GetCourierMyOrdersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<OrderDto>> Handle(GetCourierMyOrdersQuery request, CancellationToken cancellationToken)
    {
        var orders = await _context.Orders
            .AsNoTracking()
            .Include(o => o.Buyer)
            .Include(o => o.DeliveryAgent)
            .Include(o => o.OrderItems)
                .ThenInclude(i => i.Product)
            .Where(o => o.DeliveryAgentId == request.CourierUserId ||
                        _context.DeliveryTasks.Any(d => d.OrderId == o.Id && d.CourierId == request.CourierUserId))
            .OrderByDescending(o => o.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return orders.Select(OrderDto.From).ToList();
    }
}
