using System;
using MediatR;
using TheAgency.Application.Delivery.Common;

namespace TheAgency.Application.Delivery.Commands.OnboardCourier;

public sealed record OnboardCourierCommand(
    Guid UserId,
    string VehicleType,
    string DeliveryZone
) : IRequest<CourierProfileDto>;
