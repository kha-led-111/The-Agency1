using System;
using System.Collections.Generic;
using MediatR;
using TheAgency.Application.Orders.Common;

namespace TheAgency.Application.Orders.Queries.GetMyOrders;

public enum OrderRoleFilter
{
    Buyer = 0,
    Seller = 1
}

public sealed record GetMyOrdersQuery(Guid UserId, OrderRoleFilter RoleFilter = OrderRoleFilter.Buyer) : IRequest<IReadOnlyList<OrderDto>>;
