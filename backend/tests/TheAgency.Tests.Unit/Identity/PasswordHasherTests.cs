using FluentAssertions;
using TheAgency.Infrastructure.Services;
using Xunit;

namespace TheAgency.Tests.Unit.Identity;

public class PasswordHasherTests
{
    private readonly PasswordHasher _sut = new();

    [Fact]
    public void HashPassword_ShouldReturnHashedString()
    {
        // Arrange
        var password = "SecurePassword123!";

        // Act
        var hash = _sut.HashPassword(password);

        // Assert
        hash.Should().NotBeNullOrEmpty();
        hash.Should().NotBe(password);
    }

    [Fact]
    public void VerifyPassword_WithCorrectPassword_ShouldReturnTrue()
    {
        // Arrange
        var password = "SecurePassword123!";
        var hash = _sut.HashPassword(password);

        // Act
        var result = _sut.VerifyPassword(password, hash);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void VerifyPassword_WithWrongPassword_ShouldReturnFalse()
    {
        // Arrange
        var password = "SecurePassword123!";
        var wrongPassword = "WrongPassword123!";
        var hash = _sut.HashPassword(password);

        // Act
        var result = _sut.VerifyPassword(wrongPassword, hash);

        // Assert
        result.Should().BeFalse();
    }
}
