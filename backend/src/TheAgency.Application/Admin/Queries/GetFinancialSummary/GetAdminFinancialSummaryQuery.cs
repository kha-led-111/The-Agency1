using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Admin.Common;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Admin.Queries.GetFinancialSummary;

public record GetAdminFinancialSummaryQuery : IRequest<AdminFinancialSummaryDto>;

public sealed class GetAdminFinancialSummaryQueryHandler : IRequestHandler<GetAdminFinancialSummaryQuery, AdminFinancialSummaryDto>
{
    private readonly IApplicationDbContext _context;

    public GetAdminFinancialSummaryQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AdminFinancialSummaryDto> Handle(GetAdminFinancialSummaryQuery request, CancellationToken cancellationToken)
    {
        var totalOrders = await _context.Orders
            .AsNoTracking()
            .CountAsync(cancellationToken);

        var deliveredOrders = await _context.Orders
            .AsNoTracking()
            .Where(o => o.Status == OrderStatus.Delivered)
            .ToListAsync(cancellationToken);

        if (!deliveredOrders.Any())
        {
            return new AdminFinancialSummaryDto(
                GrossSalesVolume: 0.00m,
                TotalGrossItemSales: 0.00m,
                TotalPlatformCommission: 0.00m,
                TotalDeliveryFees: 0.00m,
                TotalPendingSellerPayouts: 0.00m,
                CompletedOrderCount: 0,
                TotalOrderCount: totalOrders
            );
        }

        var grossSalesVolume = deliveredOrders.Sum(o => o.TotalAmount);
        var totalGrossItemSales = deliveredOrders.Sum(o => o.ItemPrice);
        var totalPlatformCommission = deliveredOrders.Sum(o => o.PlatformEarnings);
        var totalDeliveryFees = deliveredOrders.Sum(o => o.DeliveryFee);
        var totalPendingSellerPayouts = deliveredOrders.Sum(o => o.ItemPrice - o.SellerCommission);

        return new AdminFinancialSummaryDto(
            GrossSalesVolume: grossSalesVolume,
            TotalGrossItemSales: totalGrossItemSales,
            TotalPlatformCommission: totalPlatformCommission,
            TotalDeliveryFees: totalDeliveryFees,
            TotalPendingSellerPayouts: totalPendingSellerPayouts,
            CompletedOrderCount: deliveredOrders.Count,
            TotalOrderCount: totalOrders
        );
    }
}
