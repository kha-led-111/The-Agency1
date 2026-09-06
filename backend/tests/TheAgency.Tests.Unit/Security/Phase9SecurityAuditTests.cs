using System;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using TheAgency.Infrastructure.Services;
using Xunit;

namespace TheAgency.Tests.Unit.Security;

public sealed class Phase9SecurityAuditTests
{
    [Fact]
    [Trait("Category", "SecurityAudit")]
    public void JwtConfiguration_ShouldRejectDefaultDevSecretInProductionEnvironment()
    {
        var inMemorySettings = new System.Collections.Generic.Dictionary<string, string?>
        {
            ["JWT_SECRET"] = "dev_only_change_me_super_secret_key_32c",
            ["ASPNETCORE_ENVIRONMENT"] = "Production"
        };

        IConfiguration config = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        Action act = () => JwtConfiguration.GetRequiredSecret(config, "Production");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Security Gate Violation*Production environment*");
    }

    [Fact]
    [Trait("Category", "SecurityAudit")]
    public void JwtConfiguration_ShouldAcceptStrongProductionSecretInProductionEnvironment()
    {
        var strongSecret = "prod_9F8aB7c6D5e4F3a2B1c0D9e8F7a6B5c4_SecureCustomKey_2026";
        var inMemorySettings = new System.Collections.Generic.Dictionary<string, string?>
        {
            ["JWT_SECRET"] = strongSecret,
            ["ASPNETCORE_ENVIRONMENT"] = "Production"
        };

        IConfiguration config = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        var secret = JwtConfiguration.GetRequiredSecret(config, "Production");

        secret.Should().Be(strongSecret);
    }

    [Fact]
    [Trait("Category", "SecurityAudit")]
    public void JwtConfiguration_ShouldRejectShortSecretsLessThan32Chars()
    {
        var shortSecret = "too_short_key";
        var inMemorySettings = new System.Collections.Generic.Dictionary<string, string?>
        {
            ["JWT_SECRET"] = shortSecret
        };

        IConfiguration config = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        Action act = () => JwtConfiguration.GetRequiredSecret(config, "Development");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*at least 32 characters*");
    }
}
