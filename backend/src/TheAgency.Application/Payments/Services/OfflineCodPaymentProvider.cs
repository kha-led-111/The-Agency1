using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Payments.Common;
using TheAgency.Application.Payments.Interfaces;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Payments.Services;

public class OfflineCodPaymentProvider : IPaymentProvider
{
    private readonly IApplicationDbContext _context;

    public string ProviderName => "OfflineCashOnDelivery";

    public OfflineCodPaymentProvider(IApplicationDbContext context)
    {
        _context = context;
    }

    private async Task<UserLedgerAccount> GetOrCreateLedgerAsync(Guid userId, CancellationToken cancellationToken)
    {
        var ledger = await _context.UserLedgerAccounts.FirstOrDefaultAsync(l => l.UserId == userId, cancellationToken);
        if (ledger is null)
        {
            ledger = new UserLedgerAccount
            {
                UserId = userId,
                AvailableBalance = 0m,
                PendingCashHeld = 0m,
                TotalEarned = 0m,
                TotalFeesPaid = 0m,
                UpdatedAtUtc = DateTime.UtcNow
            };
            _context.UserLedgerAccounts.Add(ledger);
        }
        return ledger;
    }

    public async Task<PaymentTransactionDto> ProcessOfflineCollectionAsync(
        Order order,
        Guid courierId,
        CancellationToken cancellationToken = default)
    {
        var sellerId = order.OrderItems.FirstOrDefault()?.Product?.SellerId ?? order.BuyerId;

        var courierLedger = await GetOrCreateLedgerAsync(courierId, cancellationToken);
        var sellerLedger = await GetOrCreateLedgerAsync(sellerId, cancellationToken);

        // Courier cash holding & earnings
        courierLedger.PendingCashHeld += order.TotalAmount;
        courierLedger.AvailableBalance += order.CourierEarnings;
        courierLedger.TotalEarned += order.CourierEarnings;
        courierLedger.UpdatedAtUtc = DateTime.UtcNow;

        // Seller net earnings
        var netSellerPayout = order.ItemPrice - order.SellerCommission;
        sellerLedger.AvailableBalance += netSellerPayout;
        sellerLedger.TotalEarned += order.ItemPrice;
        sellerLedger.TotalFeesPaid += order.SellerCommission;
        sellerLedger.UpdatedAtUtc = DateTime.UtcNow;

        var txRef = $"COD-SETTLE-{order.OrderNumber}-{Guid.NewGuid():N}[..8]";

        var collectionTx = new PaymentTransaction
        {
            OrderId = order.Id,
            UserId = courierId,
            Amount = order.TotalAmount,
            Type = TransactionType.PaymentCollection,
            Status = TransactionStatus.Completed,
            PaymentMethod = PaymentMethod.CashOnDelivery,
            TransactionRef = txRef,
            Description = $"Offline Cash on Delivery payment collected by courier for Order {order.OrderNumber}.",
            CreatedAtUtc = DateTime.UtcNow
        };

        var sellerPayoutTx = new PaymentTransaction
        {
            OrderId = order.Id,
            UserId = sellerId,
            Amount = netSellerPayout,
            Type = TransactionType.SellerPayout,
            Status = TransactionStatus.Completed,
            PaymentMethod = PaymentMethod.CashOnDelivery,
            TransactionRef = $"PAYOUT-{order.OrderNumber}-{Guid.NewGuid():N}[..8]",
            Description = $"Net seller payout for Order {order.OrderNumber} after {order.SellerCommission:C} commission.",
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.PaymentTransactions.Add(collectionTx);
        _context.PaymentTransactions.Add(sellerPayoutTx);

        return PaymentTransactionDto.From(collectionTx);
    }

    public async Task<PaymentTransactionDto> ProcessReturnFeeDeductionAsync(
        Order order,
        Guid sellerId,
        decimal fixedSellerReturnFee,
        CancellationToken cancellationToken = default)
    {
        var sellerLedger = await GetOrCreateLedgerAsync(sellerId, cancellationToken);

        sellerLedger.AvailableBalance -= fixedSellerReturnFee;
        sellerLedger.TotalFeesPaid += fixedSellerReturnFee;
        sellerLedger.UpdatedAtUtc = DateTime.UtcNow;

        var txRef = $"RETURN-FEE-{order.OrderNumber}-{Guid.NewGuid():N}[..8]";

        var returnFeeTx = new PaymentTransaction
        {
            OrderId = order.Id,
            UserId = sellerId,
            Amount = fixedSellerReturnFee,
            Type = TransactionType.SellerReturnFeeDeduction,
            Status = TransactionStatus.Completed,
            PaymentMethod = PaymentMethod.CashOnDelivery,
            TransactionRef = txRef,
            Description = $"Fixed seller return fee of {fixedSellerReturnFee:C} charged for Order {order.OrderNumber} return.",
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.PaymentTransactions.Add(returnFeeTx);

        return PaymentTransactionDto.From(returnFeeTx);
    }
}
