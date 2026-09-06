namespace TheAgency.Application.Identity.Common;

public static class EmailNormalizer
{
    public static string Normalize(string email) => email.Trim().ToLowerInvariant();
}
