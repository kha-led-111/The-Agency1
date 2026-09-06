using System.Text.Json.Serialization;

namespace TheAgency.Domain.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum OrderStatus
{
    PendingPayment = 0,
    Paid = 1,
    Processing = 2,
    OutForDelivery = 3,
    Delivered = 4,
    Cancelled = 5,
    FailedDelivery = 6,
    ReturnRequested = 7,
    Returned = 8
}
