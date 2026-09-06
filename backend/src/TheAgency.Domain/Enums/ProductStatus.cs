using System.Text.Json.Serialization;

namespace TheAgency.Domain.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ProductStatus
{
    Draft = 0,
    Published = 1,
    Reserved = 2,
    Sold = 3,
    Cancelled = 4,
    Rejected = 5,
    Removed = 6
}
