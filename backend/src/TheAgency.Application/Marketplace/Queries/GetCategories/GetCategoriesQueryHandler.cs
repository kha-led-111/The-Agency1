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
        var categories = await _context.Categories
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.Name)
            .Select(c => new
            {
                Category = c,
                ProductCount = c.Products.Count(p => p.Status == ProductStatus.Published && p.IsApproved)
            })
            .ToListAsync(cancellationToken);

        return categories
            .Select(x => CategoryDto.From(x.Category, x.ProductCount))
            .ToList();
    }
}
