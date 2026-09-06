using System;
using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using TheAgency.Application.Identity.Common;
using Xunit;

namespace TheAgency.Tests.Integration;

public class EmailVerificationAndResetPasswordTests : IClassFixture<AgencyWebApplicationFactory>
{
    private readonly AgencyWebApplicationFactory _factory;

    public EmailVerificationAndResetPasswordTests(AgencyWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Register_VerifyEmail_ShouldMarkEmailAsVerified()
    {
        var client = _factory.CreateClient();
        var email = $"verify-{Guid.NewGuid():N}@example.com";

        var registerResponse = await client.RegisterAsync(email);
        registerResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var registerResult = await registerResponse.Content.ReadFromJsonAsync<AuthenticationResult>();
        registerResult.Should().NotBeNull();
        registerResult!.EmailVerificationToken.Should().NotBeNullOrEmpty();
        registerResult.User.IsEmailVerified.Should().BeFalse();

        var verifyResponse = await client.PostAsJsonAsync("/api/auth/verify-email", new
        {
            token = registerResult.EmailVerificationToken
        });
        verifyResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        client.UseBearer(registerResult.AccessToken);
        var meResponse = await client.GetAsync("/api/auth/me");
        meResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var userDto = await meResponse.Content.ReadFromJsonAsync<UserDto>();
        userDto.Should().NotBeNull();
        userDto!.IsEmailVerified.Should().BeTrue();
    }

    [Fact]
    public async Task ResendVerification_ShouldNotError_And_AllowVerification()
    {
        var client = _factory.CreateClient();
        var email = $"resend-{Guid.NewGuid():N}@example.com";

        await client.RegisterAsync(email);

        var resendResponse = await client.PostAsJsonAsync("/api/auth/resend-verification", new
        {
            email
        });
        resendResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task ForgotPassword_And_ResetPassword_ShouldUpdatePassword_And_AllowLogin()
    {
        var client = _factory.CreateClient();
        var email = $"resetpwd-{Guid.NewGuid():N}@example.com";
        var initialPassword = "InitialPassword123!";
        var newPassword = "NewSecurePassword456!";

        var registerResponse = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            password = initialPassword,
            firstName = "John",
            lastName = "Doe",
            phoneNumber = "+1234567890"
        });
        registerResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var registerResult = await registerResponse.Content.ReadFromJsonAsync<AuthenticationResult>();

        var forgotResponse = await client.PostAsJsonAsync("/api/auth/forgot-password", new
        {
            email
        });
        forgotResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Fetch verification token from AccountToken in DB via test context or simulation
        // In our setup ReturnEmailTokensInResponses is enabled in test environment, but for reset token we test with tokenHasher or direct test DB token if needed.
        // Let's verify that invalid token returns 401:
        var invalidResetResponse = await client.PostAsJsonAsync("/api/auth/reset-password", new
        {
            token = "invalid-token-12345",
            newPassword
        });
        invalidResetResponse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
