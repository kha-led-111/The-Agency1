using System.Text.Json.Serialization;

namespace TheAgency.Domain.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum UserRole
{
    Buyer = 1,
    Seller = 2,
    Courier = 3,
    Admin = 4
}
