using System;
using System.Collections.Generic;
using TheAgency.Domain.Enums;

namespace TheAgency.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string NormalizedEmail { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Buyer;
    public DateTime? EmailVerifiedAtUtc { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }

    public bool IsEmailVerified => EmailVerifiedAtUtc.HasValue;

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<AccountToken> AccountTokens { get; set; } = new List<AccountToken>();
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
