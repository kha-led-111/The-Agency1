using System.Text.Json.Serialization;

namespace TheAgency.Domain.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ProductStatus
{
    Pending = 0,
    Draft = 1,
    Published = 2,
    Reserved = 3,
    Sold = 4,
    Cancelled = 5,
    Rejected = 6,
    Removed = 7
}
