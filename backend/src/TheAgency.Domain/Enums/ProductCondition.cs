using System.Text.Json.Serialization;

namespace TheAgency.Domain.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ProductCondition
{
    New = 0,
    LikeNew = 1,
    Excellent = 2,
    VeryGood = 3,
    Good = 4,
    Fair = 5
}
