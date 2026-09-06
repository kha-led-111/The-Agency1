using System;

namespace TheAgency.Domain.Entities;

public class UserLedgerAccount
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public decimal AvailableBalance { get; set; }
    public decimal PendingCashHeld { get; set; }
    public decimal TotalEarned { get; set; }
    public decimal TotalFeesPaid { get; set; }
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = default!;
}
