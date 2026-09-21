using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Marketplace.Common;

namespace TheAgency.Application.Marketplace.Queries.GetProductBySlug;

public sealed class GetProductBySlugQueryHandler : IRequestHandler<GetProductBySlugQuery, ProductDto>
{
    private readonly IApplicationDbContext _context;

    public GetProductBySlugQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ProductDto> Handle(GetProductBySlugQuery request, CancellationToken cancellationToken)
    {
        var isGuid = System.Guid.TryParse(request.Slug, out var productId);

        var product = await _context.Products
            .AsNoTracking()
            .Include(x => x.Category)
            .Include(x => x.Images)
            .FirstOrDefaultAsync(x => x.Slug == request.Slug || (isGuid && x.Id == productId), cancellationToken);

        if (product is null)
        {
            throw new NotFoundException("Product was not found.");
        }

        return ProductDto.From(product, product.Category.Name);
    }
}
