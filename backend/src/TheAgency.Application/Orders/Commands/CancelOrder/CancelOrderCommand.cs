using System;
using MediatR;
using TheAgency.Application.Orders.Common;

namespace TheAgency.Application.Orders.Commands.CancelOrder;

public sealed record CancelOrderCommand(Guid OrderId, Guid RequestUserId) : IRequest<OrderDto>;
