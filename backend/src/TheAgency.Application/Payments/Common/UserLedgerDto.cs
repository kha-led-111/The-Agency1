using System;
using TheAgency.Domain.Entities;

namespace TheAgency.Application.Payments.Common;

public sealed record UserLedgerDto(
    Guid Id,
    Guid UserId,
    decimal AvailableBalance,
    decimal PendingCashHeld,
    decimal TotalEarned,
    decimal TotalFeesPaid,
    DateTime UpdatedAtUtc
)
{
    public static UserLedgerDto From(UserLedgerAccount ledger) => new(
        ledger.Id,
        ledger.UserId,
        ledger.AvailableBalance,
        ledger.PendingCashHeld,
        ledger.TotalEarned,
        ledger.TotalFeesPaid,
        ledger.UpdatedAtUtc
    );
}
