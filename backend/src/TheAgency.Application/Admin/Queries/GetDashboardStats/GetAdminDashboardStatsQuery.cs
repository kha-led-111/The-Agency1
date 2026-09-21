using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Admin.Common;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Admin.Queries.GetDashboardStats;

public record GetAdminDashboardStatsQuery : IRequest<AdminDashboardStatsDto>;

public sealed class GetAdminDashboardStatsQueryHandler : IRequestHandler<GetAdminDashboardStatsQuery, AdminDashboardStatsDto>
{
    private readonly IApplicationDbContext _context;

    public GetAdminDashboardStatsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AdminDashboardStatsDto> Handle(GetAdminDashboardStatsQuery request, CancellationToken cancellationToken)
    {
        var activeSellersByRole = await _context.Users
            .AsNoTracking()
            .CountAsync(u => u.IsActive && u.Role == UserRole.Seller, cancellationToken);

        var activeSellersWithListings = await _context.Products
            .AsNoTracking()
            .Where(p => p.IsApproved)
            .Select(p => p.SellerId)
            .Distinct()
            .CountAsync(cancellationToken);

        var activeSellersCount = Math.Max(activeSellersByRole, activeSellersWithListings);

        var completedOrdersCount = await _context.Orders
            .AsNoTracking()
            .CountAsync(o => o.Status == OrderStatus.Delivered, cancellationToken);

        var totalBuyersCount = await _context.Users
            .AsNoTracking()
            .CountAsync(u => u.IsActive && u.Role == UserRole.Buyer, cancellationToken);

        var verifiedBuyersCount = await _context.Users
            .AsNoTracking()
            .CountAsync(u => u.IsActive && u.Role == UserRole.Buyer && u.EmailVerifiedAtUtc != null, cancellationToken);

        double verifiedBuyersPercentage = totalBuyersCount > 0
            ? Math.Round((double)verifiedBuyersCount / totalBuyersCount * 100, 1)
            : 100.0;

        double averageRating = 4.95;
        var hasCouriers = await _context.CourierProfiles.AsNoTracking().AnyAsync(cancellationToken);
        if (hasCouriers)
        {
            var avg = await _context.CourierProfiles.AsNoTracking().AverageAsync(c => (double)c.Rating, cancellationToken);
            averageRating = Math.Round(avg, 2);
        }

        var totalRevenue = await _context.Orders
            .AsNoTracking()
            .Where(o => o.Status == OrderStatus.Delivered)
            .SumAsync(o => (decimal?)o.TotalAmount, cancellationToken) ?? 0.00m;

        var pendingProductsCount = await _context.Products
            .AsNoTracking()
            .CountAsync(p => !p.IsApproved, cancellationToken);

        var pendingOrdersCount = await _context.Orders
            .AsNoTracking()
            .CountAsync(o => o.Status == OrderStatus.PendingAdminReview, cancellationToken);

        var totalUsersCount = await _context.Users
            .AsNoTracking()
            .CountAsync(u => u.IsActive, cancellationToken);

        return new AdminDashboardStatsDto(
            ActiveSellersCount: activeSellersCount,
            CompletedOrdersCount: completedOrdersCount,
            VerifiedBuyersCount: verifiedBuyersCount,
            VerifiedBuyersPercentage: verifiedBuyersPercentage,
            AverageRating: averageRating,
            TotalRevenue: totalRevenue,
            PendingProductsCount: pendingProductsCount,
            PendingOrdersCount: pendingOrdersCount,
            TotalUsersCount: totalUsersCount
        );
    }
}
