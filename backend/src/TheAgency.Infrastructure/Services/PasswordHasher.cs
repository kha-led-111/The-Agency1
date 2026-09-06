using Microsoft.AspNetCore.Identity;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Domain.Entities;

namespace TheAgency.Infrastructure.Services;

public class PasswordHasher : IPasswordHasher
{
    private readonly PasswordHasher<User> _hasher = new();
    private static readonly User DummyUser = new();

    public string HashPassword(string password)
    {
        return _hasher.HashPassword(DummyUser, password);
    }

    public bool VerifyPassword(string password, string passwordHash)
    {
        var result = _hasher.VerifyHashedPassword(DummyUser, passwordHash, password);
        return result != PasswordVerificationResult.Failed;
    }
}
