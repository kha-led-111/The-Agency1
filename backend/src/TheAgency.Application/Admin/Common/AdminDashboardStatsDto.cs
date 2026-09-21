namespace TheAgency.Application.Admin.Common;

public sealed record AdminDashboardStatsDto(
    int ActiveSellersCount,
    int CompletedOrdersCount,
    int VerifiedBuyersCount,
    double VerifiedBuyersPercentage,
    double AverageRating,
    decimal TotalRevenue,
    int PendingProductsCount,
    int PendingOrdersCount,
    int TotalUsersCount
);
