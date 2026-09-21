namespace TheAgency.Application.Admin.Common;

public sealed record AdminFinancialSummaryDto(
    decimal GrossSalesVolume,
    decimal TotalGrossItemSales,
    decimal TotalPlatformCommission,
    decimal TotalDeliveryFees,
    decimal TotalPendingSellerPayouts,
    int CompletedOrderCount,
    int TotalOrderCount
);
