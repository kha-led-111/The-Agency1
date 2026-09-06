using System;
using MediatR;
using TheAgency.Application.Orders.Common;

namespace TheAgency.Application.Orders.Commands.SettleCODPayment;

public sealed record SettleCODPaymentCommand(Guid OrderId, Guid RequestUserId) : IRequest<OrderDto>;
