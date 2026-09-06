namespace TheAgency.Application.Identity;

public sealed class IdentitySettings
{
    public const string SectionName = "Identity";

    public bool ReturnEmailTokensInResponses { get; set; }
    public int EmailVerificationExpirationHours { get; set; } = 24;
    public int PasswordResetExpirationHours { get; set; } = 1;
    public int AuthRateLimitPermit { get; set; } = 10;
    public int AuthRateLimitWindowMinutes { get; set; } = 1;
}
