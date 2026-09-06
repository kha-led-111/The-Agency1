using System.Text.Json.Serialization;

namespace TheAgency.Domain.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TransactionStatus
{
    Pending = 1,
    Completed = 2,
    Failed = 3,
    Reversed = 4
}
