using System;
using MediatR;
using TheAgency.Application.Orders.Common;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Orders.Commands.UpdateOrderStatus;

public sealed record UpdateOrderStatusCommand(
    Guid OrderId,
    Guid RequestUserId,
    UserRole UserRole,
    OrderStatus NewStatus
) : IRequest<OrderDto>;  
