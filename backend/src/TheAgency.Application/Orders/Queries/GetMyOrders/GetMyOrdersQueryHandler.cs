using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Orders.Common;

namespace TheAgency.Application.Orders.Queries.GetMyOrders;

public sealed class GetMyOrdersQueryHandler : IRequestHandler<GetMyOrdersQuery, IReadOnlyList<OrderDto>>
{
    private readonly IApplicationDbContext _context;

    public GetMyOrdersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<OrderDto>> Handle(GetMyOrdersQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Orders
            .AsNoTracking()
            .Include(o => o.OrderItems)
                .ThenInclude(i => i.Product)
            .AsQueryable();

        if (request.RoleFilter == OrderRoleFilter.Buyer)
        {
            query = query.Where(o => o.BuyerId == request.UserId);
        }
        else
        {
            query = query.Where(o => o.OrderItems.Any(i => i.Product != null && i.Product.SellerId == request.UserId));
        }

        var orders = await query
            .OrderByDescending(o => o.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return orders.Select(OrderDto.From).ToList();
    }
}
