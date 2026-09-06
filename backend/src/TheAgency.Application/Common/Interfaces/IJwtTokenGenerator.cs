using System;
using TheAgency.Domain.Entities;

namespace TheAgency.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateAccessToken(User user);
    IssuedRefreshToken IssueRefreshToken(Guid userId);
}

public sealed class IssuedRefreshToken
{
    public required RefreshToken Entity { get; init; }
    public required string PlainText { get; init; }
}
