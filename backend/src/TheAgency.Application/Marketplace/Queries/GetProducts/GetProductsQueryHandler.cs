using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Common.Models;
using TheAgency.Application.Marketplace.Common;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Marketplace.Queries.GetProducts;

public sealed class GetProductsQueryHandler : IRequestHandler<GetProductsQuery, PagedResult<ProductDto>>
{
    private readonly IApplicationDbContext _context;

    public GetProductsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<ProductDto>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Products
            .AsNoTracking()
            .Include(x => x.Category)
            .Include(x => x.Images)
            .Where(x => x.Status == ProductStatus.Published && x.IsApproved);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(x => x.Title.ToLower().Contains(search) || x.Description.ToLower().Contains(search));
        }

        if (request.SubcategoryId.HasValue)
        {
            var subId = request.SubcategoryId.Value;
            query = query.Where(x => x.SubcategoryId == subId || x.CategoryId == subId);
        }

        if (request.CategoryId.HasValue)
        {
            var catId = request.CategoryId.Value;
            query = query.Where(x => x.CategoryId == catId || x.SubcategoryId == catId || (x.Category != null && x.Category.ParentId == catId));
        }

        if (request.MinPrice.HasValue)
        {
            query = query.Where(x => x.Price >= request.MinPrice.Value);
        }

        if (request.MaxPrice.HasValue)
        {
            query = query.Where(x => x.Price <= request.MaxPrice.Value);
        }

        if (request.Condition.HasValue)
        {
            query = query.Where(x => x.Condition == request.Condition.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Size))
        {
            var size = request.Size.Trim().ToLower();
            query = query.Where(x => x.Size != null && x.Size.ToLower() == size);
        }

        query = request.SortBy?.ToLower() switch
        {
            "price_asc" => query.OrderBy(x => x.Price),
            "price_desc" => query.OrderByDescending(x => x.Price),
            _ => query.OrderByDescending(x => x.CreatedAtUtc)
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Clamp(request.PageSize, 1, 50);
        var skip = (pageNumber - 1) * pageSize;

        var items = await query
            .Skip(skip)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = items
            .Select(x => ProductDto.From(x, x.Category.Name))
            .ToList();

        return new PagedResult<ProductDto>(dtos, totalCount, pageNumber, pageSize);
    }
}
