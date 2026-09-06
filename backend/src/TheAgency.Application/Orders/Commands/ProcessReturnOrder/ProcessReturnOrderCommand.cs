using System;
using MediatR;
using TheAgency.Application.Orders.Common;

namespace TheAgency.Application.Orders.Commands.ProcessReturnOrder;

public sealed record ProcessReturnOrderCommand(Guid OrderId, Guid RequestUserId) : IRequest<OrderDto>;
