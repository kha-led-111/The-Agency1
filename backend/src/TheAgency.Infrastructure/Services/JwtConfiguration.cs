using System;
using Microsoft.Extensions.Configuration;

namespace TheAgency.Infrastructure.Services;

public static class JwtConfiguration
{
    private static readonly string[] DefaultDevSecrets = new[]
    {
        "dev_only_change_me_super_secret_key_32c",
        "super_secret_key_that_must_be_long_and_secure_32_chars_at_least",
        "change_this_to_a_long_secure_random_key_for_production_32chars"
    };

    public static string GetRequiredSecret(IConfiguration configuration, string? environmentName = null)
    {
        var secret = configuration["JWT_SECRET"] ?? configuration["JwtSettings:Secret"];
        var env = environmentName ?? configuration["ASPNETCORE_ENVIRONMENT"] ?? "Development";

        if (string.IsNullOrWhiteSpace(secret) || secret.Length < 32)
        {
            throw new InvalidOperationException(
                "JWT_SECRET (or JwtSettings:Secret) must be configured and at least 32 characters.");
        }

        if (string.Equals(env, "Production", StringComparison.OrdinalIgnoreCase))
        {
            foreach (var devSecret in DefaultDevSecrets)
            {
                if (string.Equals(secret, devSecret, StringComparison.Ordinal))
                {
                    throw new InvalidOperationException(
                        "Security Gate Violation: JWT_SECRET cannot use default development keys in Production environment.");
                }
            }
        }

        return secret;
    }
}
