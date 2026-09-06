using System;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Payments.Common;

public sealed record PaymentTransactionDto(
    Guid Id,
    Guid? OrderId,
    Guid UserId,
    decimal Amount,
    TransactionType Type,
    TransactionStatus Status,
    PaymentMethod PaymentMethod,
    string TransactionRef,
    string Description,
    DateTime CreatedAtUtc
)
{
    public static PaymentTransactionDto From(PaymentTransaction tx) => new(
        tx.Id,
        tx.OrderId,
        tx.UserId,
        tx.Amount,
        tx.Type,
        tx.Status,
        tx.PaymentMethod,
        tx.TransactionRef,
        tx.Description,
        tx.CreatedAtUtc
    );
}
