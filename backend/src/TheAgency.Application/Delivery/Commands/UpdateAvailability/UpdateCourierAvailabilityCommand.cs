using System;
using MediatR;
using TheAgency.Application.Delivery.Common;

namespace TheAgency.Application.Delivery.Commands.UpdateAvailability;

public sealed record UpdateCourierAvailabilityCommand(
    Guid UserId,
    bool IsAvailable
) : IRequest<CourierProfileDto>;
