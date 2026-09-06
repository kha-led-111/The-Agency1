using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using TheAgency.Application.Identity.Common;
using TheAgency.Domain.Enums;
using Xunit;

namespace TheAgency.Tests.Integration;

public class AuthEndpointsTests : IClassFixture<AgencyWebApplicationFactory>
{
    private readonly AgencyWebApplicationFactory _factory;

    public AuthEndpointsTests(AgencyWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task RegisterLoginAndGetMe_FullAuthFlow_ShouldSucceed()
    {
        var client = _factory.CreateClient();
        var email = $"authflow-{Guid.NewGuid():N}@example.com";

        var registerResponse = await client.RegisterAsync(email);
        registerResponse.StatusCode.Should().Be(HttpStatusCode.OK, await registerResponse.Content.ReadAsStringAsync());

        var registerResult = await registerResponse.Content.ReadFromJsonAsync<AuthenticationResult>();
        registerResult.Should().NotBeNull();
        registerResult!.AccessToken.Should().NotBeNullOrEmpty();
        registerResult.User.Email.Should().Be(email);
        registerResult.User.Role.Should().Be(UserRole.Buyer);
        registerResult.User.IsEmailVerified.Should().BeFalse();

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new { email, password = "Password123!" });
        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var loginResult = await loginResponse.Content.ReadFromJsonAsync<AuthenticationResult>();
        loginResult.Should().NotBeNull();

        client.UseBearer(loginResult!.AccessToken);
        var meResponse = await client.GetAsync("/api/me");
        meResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var userDto = await meResponse.Content.ReadFromJsonAsync<UserDto>();
        userDto.Should().NotBeNull();
        userDto!.Email.Should().Be(email);
        userDto.FirstName.Should().Be("Alice");
    }

    [Fact]
    public async Task Register_WithAdminRoleInPayload_ShouldAlwaysCreateBuyer()
    {
        var client = _factory.CreateClient();
        var email = $"role-{Guid.NewGuid():N}@example.com";

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            password = "Password123!",
            firstName = "Eve",
            lastName = "Admin",
            phoneNumber = "000",
            role = 4
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<AuthenticationResult>();
        result!.User.Role.Should().Be(UserRole.Buyer);
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ShouldReturnConflict()
    {
        var client = _factory.CreateClient();
        var email = $"dup-{Guid.NewGuid():N}@example.com";

        (await client.RegisterAsync(email)).StatusCode.Should().Be(HttpStatusCode.OK);
        var duplicate = await client.RegisterAsync(email.ToUpperInvariant());
        duplicate.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Register_WithWeakPassword_ShouldReturnValidationProblem()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = $"weak-{Guid.NewGuid():N}@example.com",
            password = "password",
            firstName = "A",
            lastName = "B",
            phoneNumber = "1"
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetMe_WithoutToken_ShouldReturnUnauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/me");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_WithWrongPassword_ShouldReturnUnauthorized()
    {
        var client = _factory.CreateClient();
        var email = $"badpw-{Guid.NewGuid():N}@example.com";
        (await client.RegisterAsync(email)).EnsureSuccessStatusCode();

        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password = "WrongPass1!" });
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Refresh_WithRotatedToken_ShouldRejectReuse()
    {
        var client = _factory.CreateClient();
        var email = $"refresh-{Guid.NewGuid():N}@example.com";
        var register = await (await client.RegisterAsync(email)).Content.ReadFromJsonAsync<AuthenticationResult>();

        var firstRefresh = await client.PostAsJsonAsync("/api/auth/refresh", new { refreshToken = register!.RefreshToken });
        firstRefresh.StatusCode.Should().Be(HttpStatusCode.OK);

        var reuse = await client.PostAsJsonAsync("/api/auth/refresh", new { refreshToken = register.RefreshToken });
        reuse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Logout_ShouldRevokeRefreshToken()
    {
        var client = _factory.CreateClient();
        var email = $"logout-{Guid.NewGuid():N}@example.com";
        var register = await (await client.RegisterAsync(email)).Content.ReadFromJsonAsync<AuthenticationResult>();

        var logout = await client.PostAsJsonAsync("/api/auth/logout", new { refreshToken = register!.RefreshToken });
        logout.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var refresh = await client.PostAsJsonAsync("/api/auth/refresh", new { refreshToken = register.RefreshToken });
        refresh.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task VerifyEmailAndResetPassword_ShouldSucceed()
    {
        var client = _factory.CreateClient();
        var email = $"verify-{Guid.NewGuid():N}@example.com";
        _factory.Emails.Messages.Clear();

        var register = await (await client.RegisterAsync(email)).Content.ReadFromJsonAsync<AuthenticationResult>();
        register!.EmailVerificationToken.Should().NotBeNullOrEmpty();

        var verify = await client.PostAsJsonAsync("/api/auth/verify-email", new { token = register.EmailVerificationToken });
        verify.StatusCode.Should().Be(HttpStatusCode.NoContent);

        client.UseBearer(register.AccessToken);
        var me = await client.GetAsync("/api/me");
        var user = await me.Content.ReadFromJsonAsync<UserDto>();
        user!.IsEmailVerified.Should().BeTrue();

        var forgot = await client.PostAsJsonAsync("/api/auth/forgot-password", new { email });
        forgot.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var resetToken = _factory.Emails.Messages.Last(m => m.Purpose == "PasswordReset").Token;
        var reset = await client.PostAsJsonAsync("/api/auth/reset-password", new
        {
            token = resetToken,
            newPassword = "NewPassword123!"
        });
        reset.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var oldLogin = await client.PostAsJsonAsync("/api/auth/login", new { email, password = "Password123!" });
        oldLogin.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var newLogin = await client.PostAsJsonAsync("/api/auth/login", new { email, password = "NewPassword123!" });
        newLogin.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ForgotPassword_UnknownEmail_ShouldStillReturnNoContent()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/forgot-password", new { email = "missing@example.com" });
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }
}
