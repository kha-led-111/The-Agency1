using System;

namespace TheAgency.Domain.Entities;

public class CourierProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string VehicleType { get; set; } = "Motorcycle"; // Motorcycle, Bicycle, Car, Van
    public bool IsAvailable { get; set; } = true;
    public string DeliveryZone { get; set; } = "Cairo Central";
    public int ActiveDeliveriesCount { get; set; } = 0;
    public decimal Rating { get; set; } = 5.0m;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }

    public User User { get; set; } = default!;
}
