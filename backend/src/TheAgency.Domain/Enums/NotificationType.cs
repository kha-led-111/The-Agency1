using System.Text.Json.Serialization;

namespace TheAgency.Domain.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum NotificationType
{
    InApp = 1,
    Email = 2,
    PushReady = 3
}
