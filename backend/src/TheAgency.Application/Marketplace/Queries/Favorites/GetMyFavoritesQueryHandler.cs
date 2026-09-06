using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Marketplace.Common;

namespace TheAgency.Application.Marketplace.Queries.Favorites;

public sealed class GetMyFavoritesQueryHandler : IRequestHandler<GetMyFavoritesQuery, IReadOnlyList<ProductDto>>
{
    private readonly IApplicationDbContext _context;

    public GetMyFavoritesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<ProductDto>> Handle(GetMyFavoritesQuery request, CancellationToken cancellationToken)
    {
        var productIds = await _context.Favorites
            .AsNoTracking()
            .Where(f => f.UserId == request.UserId)
            .Select(f => f.ProductId)
            .ToListAsync(cancellationToken);

        if (productIds.Count == 0)
        {
            return Array.Empty<ProductDto>();
        }

        var products = await _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync(cancellationToken);

        return products
            .Select(p => ProductDto.From(p, p.Category.Name))
            .ToList();
    }
}
