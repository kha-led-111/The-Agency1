using System;
using System.Security.Claims;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TheAgency.Application.Identity.Commands.ForgotPassword;
using TheAgency.Application.Identity.Commands.Login;
using TheAgency.Application.Identity.Commands.Logout;
using TheAgency.Application.Identity.Commands.RefreshToken;
using TheAgency.Application.Identity.Commands.Register;
using TheAgency.Application.Identity.Commands.ResendVerification;
using TheAgency.Application.Identity.Commands.ResetPassword;
using TheAgency.Application.Identity.Commands.VerifyEmail;
using TheAgency.Application.Identity.Common;

using Microsoft.Extensions.Logging;

namespace TheAgency.API.Controllers;

[ApiController]
[Route("api/auth")]
[EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{
    private readonly ISender _sender;
    private readonly ILogger<AuthController> _logger;

    public AuthController(ISender sender, ILogger<AuthController> logger)
    {
        _sender = sender;
        _logger = logger;
    }

    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthenticationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterCommand command)
    {
        var result = await _sender.Send(command);
        SetAuthCookies(result.AccessToken, result.RefreshToken);
        return Ok(result);
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthenticationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginCommand command)
    {
        _logger.LogInformation("AuthController.Login: Processing login request for {Email}", command.Email);
        try
        {
            var result = await _sender.Send(command);
            SetAuthCookies(result.AccessToken, result.RefreshToken);
            _logger.LogInformation("AuthController.Login: Successfully authenticated {Email}", command.Email);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "AuthController.Login: Login failed for {Email}", command.Email);
            throw;
        }
    }

    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthenticationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenCommand? command)
    {
        var refreshToken = command?.RefreshToken;
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            refreshToken = Request.Cookies["refreshToken"];
        }

        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return Unauthorized(new { message = "Refresh token is missing." });
        }

        var result = await _sender.Send(new RefreshTokenCommand(refreshToken));
        SetAuthCookies(result.AccessToken, result.RefreshToken);
        return Ok(result);
    }

    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout([FromBody] LogoutCommand? command)
    {
        var refreshToken = command?.RefreshToken ?? Request.Cookies["refreshToken"];
        if (!string.IsNullOrWhiteSpace(refreshToken))
        {
            await _sender.Send(new LogoutCommand(refreshToken));
        }

        ClearAuthCookies();
        return NoContent();
    }

    private void SetAuthCookies(string accessToken, string refreshToken)
    {
        var isSecure = Request.IsHttps;

        Response.Cookies.Append("accessToken", accessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = isSecure,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });

        Response.Cookies.Append("refreshToken", refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = isSecure,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });
    }

    private void ClearAuthCookies()
    {
        Response.Cookies.Delete("accessToken");
        Response.Cookies.Delete("refreshToken");
    }

    [HttpPost("verify-email")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailCommand command)
    {
        await _sender.Send(command);
        return NoContent();
    }

    [HttpPost("resend-verification")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationCommand command)
    {
        await _sender.Send(command);
        return NoContent();
    }

    [HttpPost("forgot-password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordCommand command)
    {
        await _sender.Send(command);
        return NoContent();
    }

    [HttpPost("reset-password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordCommand command)
    {
        await _sender.Send(command);
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    [DisableRateLimiting]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMe()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var result = await _sender.Send(new TheAgency.Application.Identity.Queries.GetCurrentUser.GetCurrentUserQuery(userId));
        return Ok(result);
    }
}
