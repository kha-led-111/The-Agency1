using System;
using TheAgency.Domain.Enums;

namespace TheAgency.Domain.Entities;

public class DeliveryTrackingEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DeliveryTaskId { get; set; }
    public DeliveryStatus Status { get; set; }
    public string Note { get; set; } = string.Empty;
    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;

    public DeliveryTask DeliveryTask { get; set; } = default!;
}
