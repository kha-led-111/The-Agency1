using System;
using System.Collections.Generic;
using System.Linq;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Delivery.Common;

public sealed record DeliveryTaskDto(
    Guid Id,
    Guid OrderId,
    Guid? CourierId,
    DeliveryStatus Status,
    string PickupAddress,
    string DeliveryAddress,
    DateTime? AssignedAtUtc,
    DateTime? PickedUpAtUtc,
    DateTime? DeliveredAtUtc,
    string? FailureReason,
    DateTime CreatedAtUtc,
    IReadOnlyList<DeliveryTrackingEventDto> TrackingEvents
)
{
    public static DeliveryTaskDto From(DeliveryTask task) => new(
        task.Id,
        task.OrderId,
        task.CourierId,
        task.Status,
        task.PickupAddress,
        task.DeliveryAddress,
        task.AssignedAtUtc,
        task.PickedUpAtUtc,
        task.DeliveredAtUtc,
        task.FailureReason,
        task.CreatedAtUtc,
        task.TrackingEvents.Select(DeliveryTrackingEventDto.From).ToList()
    );
}
