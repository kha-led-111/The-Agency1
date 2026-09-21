using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Marketplace.Common;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Marketplace.Queries.GetCategories;

public sealed class GetCategoriesQueryHandler : IRequestHandler<GetCategoriesQuery, IReadOnlyList<CategoryDto>>
{
    private readonly IApplicationDbContext _context;

    public GetCategoriesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<CategoryDto>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
    {
        var allCategories = await _context.Categories
            .AsNoTracking()
            .Include(c => c.Subcategories)
            .Where(x => x.IsActive)
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);

        var productCounts = await _context.Products
            .AsNoTracking()
            .Where(p => p.Status == ProductStatus.Published && p.IsApproved)
            .GroupBy(p => p.CategoryId)
            .Select(g => new { CategoryId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.CategoryId, x => x.Count, cancellationToken);

        var topLevelCategories = allCategories
            .Where(c => c.ParentId == null)
            .Select(c =>
            {
                var subDtos = c.Subcategories
                    .Where(s => s.IsActive)
                    .OrderBy(s => s.Name)
                    .Select(s => CategoryDto.From(s, productCounts.GetValueOrDefault(s.Id, 0)))
                    .ToList();

                var parentProductCount = productCounts.GetValueOrDefault(c.Id, 0) + subDtos.Sum(s => s.ProductCount);
                return CategoryDto.From(c, parentProductCount, subDtos);
            })
            .ToList();

        return topLevelCategories;
    }
}
