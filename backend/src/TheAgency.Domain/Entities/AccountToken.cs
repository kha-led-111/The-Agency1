using System;
using TheAgency.Domain.Enums;

namespace TheAgency.Domain.Entities;

public class AccountToken
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public AccountTokenPurpose Purpose { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UsedAtUtc { get; set; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAtUtc;
    public bool IsUsed => UsedAtUtc.HasValue;
    public bool IsActive => !IsUsed && !IsExpired;

    public User? User { get; set; }
}
