using System.Text.Json.Serialization;

namespace TheAgency.Domain.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum DeliveryStatus
{
    PendingAssignment = 1,
    Assigned = 2,
    PickedUp = 3,
    OutForDelivery = 4,
    Delivered = 5,
    Failed = 6
}
