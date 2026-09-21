using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Admin.Common;
using TheAgency.Application.Common.Interfaces;

namespace TheAgency.Application.Admin.Queries.GetPendingProducts;

public record GetPendingProductsForAdminQuery : IRequest<IReadOnlyList<AdminProductReviewDto>>;

public sealed class GetPendingProductsForAdminQueryHandler : IRequestHandler<GetPendingProductsForAdminQuery, IReadOnlyList<AdminProductReviewDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPendingProductsForAdminQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<AdminProductReviewDto>> Handle(GetPendingProductsForAdminQuery request, CancellationToken cancellationToken)
    {
        var pendingProducts = await _context.Products
            .AsNoTracking()
            .Include(x => x.Category)
            .Include(x => x.Seller)
            .Where(x => !x.IsApproved)
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return pendingProducts
            .Select(AdminProductReviewDto.From)
            .ToList();
    }
}
