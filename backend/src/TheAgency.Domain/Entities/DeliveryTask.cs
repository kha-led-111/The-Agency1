using System;
using System.Collections.Generic;
using TheAgency.Domain.Enums;

namespace TheAgency.Domain.Entities;

public class DeliveryTask
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Guid? CourierId { get; set; }
    public DeliveryStatus Status { get; set; } = DeliveryStatus.PendingAssignment;
    public string PickupAddress { get; set; } = string.Empty;
    public string DeliveryAddress { get; set; } = string.Empty;
    public DateTime? AssignedAtUtc { get; set; }
    public DateTime? PickedUpAtUtc { get; set; }
    public DateTime? DeliveredAtUtc { get; set; }
    public string? FailureReason { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }

    public Order Order { get; set; } = default!;
    public User? Courier { get; set; }
    public ICollection<DeliveryTrackingEvent> TrackingEvents { get; set; } = new List<DeliveryTrackingEvent>();
}
