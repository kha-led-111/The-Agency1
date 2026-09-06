using System;
using TheAgency.Domain.Entities;

namespace TheAgency.Application.Delivery.Common;

public sealed record CourierProfileDto(
    Guid Id,
    Guid UserId,
    string VehicleType,
    bool IsAvailable,
    string DeliveryZone,
    int ActiveDeliveriesCount,
    decimal Rating,
    DateTime CreatedAtUtc
)
{
    public static CourierProfileDto From(CourierProfile profile) => new(
        profile.Id,
        profile.UserId,
        profile.VehicleType,
        profile.IsAvailable,
        profile.DeliveryZone,
        profile.ActiveDeliveriesCount,
        profile.Rating,
        profile.CreatedAtUtc
    );
}
