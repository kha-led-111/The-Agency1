using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Orders.Common;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Orders.Queries.GetPendingAdminOrders;

public record GetPendingAdminOrdersQuery : IRequest<IReadOnlyList<OrderDto>>;

public sealed class GetPendingAdminOrdersQueryHandler : IRequestHandler<GetPendingAdminOrdersQuery, IReadOnlyList<OrderDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPendingAdminOrdersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<OrderDto>> Handle(GetPendingAdminOrdersQuery request, CancellationToken cancellationToken)
    {
        var orders = await _context.Orders
            .AsNoTracking()
            .Include(o => o.DeliveryAgent)
            .Include(o => o.OrderItems)
                .ThenInclude(i => i.Product)
            .Where(o => o.Status == OrderStatus.PendingAdminReview)
            .OrderByDescending(o => o.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return orders.Select(OrderDto.From).ToList();
    }
}
