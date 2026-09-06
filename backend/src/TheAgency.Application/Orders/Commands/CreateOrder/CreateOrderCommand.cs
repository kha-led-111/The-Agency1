using System;
using System.Collections.Generic;
using MediatR;
using TheAgency.Application.Orders.Common;

namespace TheAgency.Application.Orders.Commands.CreateOrder;

public sealed record CreateOrderCommand(
    Guid BuyerId,
    IReadOnlyList<Guid> ProductIds,
    string ShippingAddress,
    string? IdempotencyKey = null
) : IRequest<OrderDto>;
