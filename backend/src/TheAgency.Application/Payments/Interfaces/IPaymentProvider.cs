using System.Threading;
using System.Threading.Tasks;
using TheAgency.Application.Payments.Common;
using TheAgency.Domain.Entities;

namespace TheAgency.Application.Payments.Interfaces;

public interface IPaymentProvider
{
    string ProviderName { get; }

    Task<PaymentTransactionDto> ProcessOfflineCollectionAsync(
        Order order,
        Guid courierId,
        CancellationToken cancellationToken = default);

    Task<PaymentTransactionDto> ProcessReturnFeeDeductionAsync(
        Order order,
        Guid sellerId,
        decimal fixedSellerReturnFee,
        CancellationToken cancellationToken = default);

    Task<PaymentTransactionDto> ProcessFullReturnSettlementAsync(
        Order order,
        Guid buyerId,
        Guid sellerId,
        Guid? courierId,
        decimal returnFee = 20.00m,
        CancellationToken cancellationToken = default);
}
