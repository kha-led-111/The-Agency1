using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;
using TheAgency.Infrastructure.Services;
using Xunit;

namespace TheAgency.Tests.Unit.Identity;

public class JwtTokenGeneratorTests
{
    private readonly JwtTokenGenerator _sut;

    public JwtTokenGeneratorTests()
    {
        var inMemorySettings = new Dictionary<string, string?>
        {
            { "JWT_SECRET", "dev_only_change_me_super_secret_key_32c" },
            { "JWT_ISSUER", "TheAgency" },
            { "JWT_AUDIENCE", "TheAgency" },
            { "JWT_EXPIRATION_MINUTES", "15" },
            { "JWT_REFRESH_EXPIRATION_DAYS", "7" }
        };

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        _sut = new JwtTokenGenerator(configuration, new TokenHasher());
    }

    [Fact]
    public void GenerateAccessToken_ShouldReturnValidJwtWithUserClaims()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            FirstName = "John",
            LastName = "Doe",
            Role = UserRole.Buyer
        };

        var tokenString = _sut.GenerateAccessToken(user);

        tokenString.Should().NotBeNullOrEmpty();

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(tokenString);

        jwt.Issuer.Should().Be("TheAgency");
        jwt.Audiences.Should().Contain("TheAgency");

        var emailClaim = jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email || c.Type == JwtRegisteredClaimNames.Email)?.Value;
        emailClaim.Should().Be(user.Email);

        var roleClaim = jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;
        roleClaim.Should().Be(UserRole.Buyer.ToString());
    }

    [Fact]
    public void IssueRefreshToken_ShouldStoreHashNotPlaintext()
    {
        var userId = Guid.NewGuid();
        var hasher = new TokenHasher();

        var issued = _sut.IssueRefreshToken(userId);

        issued.PlainText.Should().NotBeNullOrEmpty();
        issued.Entity.UserId.Should().Be(userId);
        issued.Entity.Token.Should().Be(hasher.Hash(issued.PlainText));
        issued.Entity.Token.Should().NotBe(issued.PlainText);
        issued.Entity.IsActive.Should().BeTrue();
    }
}
