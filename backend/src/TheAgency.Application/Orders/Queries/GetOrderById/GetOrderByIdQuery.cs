using System;
using MediatR;
using TheAgency.Application.Orders.Common;

namespace TheAgency.Application.Orders.Queries.GetOrderById;

public sealed record GetOrderByIdQuery(Guid OrderId, Guid RequestUserId) : IRequest<OrderDto>;
