using System;
using MediatR;
using TheAgency.Application.Orders.Common;

namespace TheAgency.Application.Orders.Commands.ConfirmSellerAvailability;

public sealed record ConfirmSellerAvailabilityCommand(
    Guid OrderId,
    Guid SellerId,
    bool IsAvailable,
    string? Reason = null) : IRequest<OrderDto>;
