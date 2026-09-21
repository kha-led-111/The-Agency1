using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Admin.Common;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;

namespace TheAgency.Application.Admin.Queries.GetProductReviewDetails;

public record GetProductReviewDetailsQuery(Guid ProductId) : IRequest<AdminProductReviewDto>;

public sealed class GetProductReviewDetailsQueryHandler : IRequestHandler<GetProductReviewDetailsQuery, AdminProductReviewDto>
{
    private readonly IApplicationDbContext _context;

    public GetProductReviewDetailsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AdminProductReviewDto> Handle(GetProductReviewDetailsQuery request, CancellationToken cancellationToken)
    {
        var product = await _context.Products
            .AsNoTracking()
            .Include(x => x.Category)
            .Include(x => x.Seller)
            .FirstOrDefaultAsync(x => x.Id == request.ProductId, cancellationToken);

        if (product is null)
        {
            throw new NotFoundException("Product review item was not found.");
        }

        return AdminProductReviewDto.From(product);
    }
}
