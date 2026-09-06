using System.Text.Json.Serialization;

namespace TheAgency.Application.Identity.Common;

public class AuthenticationResult
{
    public UserDto User { get; set; } = null!;
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? EmailVerificationToken { get; set; }
}
