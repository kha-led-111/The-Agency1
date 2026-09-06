using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Domain.Entities;

namespace TheAgency.Infrastructure.Services;

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly IConfiguration _configuration;
    private readonly ITokenHasher _tokenHasher;

    public JwtTokenGenerator(IConfiguration configuration, ITokenHasher tokenHasher)
    {
        _configuration = configuration;
        _tokenHasher = tokenHasher;
    }

    public string GenerateAccessToken(User user)
    {
        var secret = JwtConfiguration.GetRequiredSecret(_configuration);
        var issuer = _configuration["JWT_ISSUER"] ?? _configuration["JwtSettings:Issuer"] ?? "TheAgency";
        var audience = _configuration["JWT_AUDIENCE"] ?? _configuration["JwtSettings:Audience"] ?? "TheAgency";

        var expirationMinutesStr = _configuration["JWT_EXPIRATION_MINUTES"] ?? _configuration["JwtSettings:ExpirationMinutes"];
        var expirationMinutes = int.TryParse(expirationMinutesStr, out var exp) ? exp : 15;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("given_name", user.FirstName),
            new("family_name", user.LastName)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public IssuedRefreshToken IssueRefreshToken(Guid userId)
    {
        var refreshExpDaysStr = _configuration["JWT_REFRESH_EXPIRATION_DAYS"] ?? _configuration["JwtSettings:RefreshExpirationDays"];
        var refreshExpDays = int.TryParse(refreshExpDaysStr, out var days) ? days : 7;

        var plaintext = _tokenHasher.CreatePlaintextToken();

        var entity = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = _tokenHasher.Hash(plaintext),
            ExpiresAtUtc = DateTime.UtcNow.AddDays(refreshExpDays),
            CreatedAtUtc = DateTime.UtcNow
        };

        return new IssuedRefreshToken
        {
            Entity = entity,
            PlainText = plaintext
        };
    }
}
