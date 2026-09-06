using System;
using MediatR;
using TheAgency.Application.Delivery.Common;

namespace TheAgency.Application.Delivery.Commands.AssignDelivery;

public sealed record AssignDeliveryCommand(
    Guid OrderId,
    Guid? RequestedCourierId = null
) : IRequest<DeliveryTaskDto>;
