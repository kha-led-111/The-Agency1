using System;
using MediatR;
using TheAgency.Application.Delivery.Common;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Delivery.Commands.UpdateDeliveryStatus;

public sealed record UpdateDeliveryTaskStatusCommand(
    Guid DeliveryTaskId,
    Guid RequestUserId,
    UserRole RequestUserRole,
    DeliveryStatus NewStatus,
    string? Note = null,
    string? FailureReason = null
) : IRequest<DeliveryTaskDto>;
