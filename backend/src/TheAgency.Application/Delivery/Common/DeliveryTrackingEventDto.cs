using System;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Delivery.Common;

public sealed record DeliveryTrackingEventDto(
    Guid Id,
    Guid DeliveryTaskId,
    DeliveryStatus Status,
    string Note,
    DateTime TimestampUtc
)
{
    public static DeliveryTrackingEventDto From(DeliveryTrackingEvent evt) => new(
        evt.Id,
        evt.DeliveryTaskId,
        evt.Status,
        evt.Note,
        evt.TimestampUtc
    );
}
