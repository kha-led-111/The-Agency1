using System;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Marketplace.Common;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Marketplace.Commands.UpdateProduct;

public sealed class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, ProductDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateProductCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ProductDto> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _context.Products
            .Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.Id == request.ProductId, cancellationToken);

        if (product is null)
        {
            throw new NotFoundException("Product was not found.");
        }

        if (product.SellerId != request.SellerId)
        {
            throw new UnauthorizedException("You can only update your own products.");
        }

        bool wasApprovedOrPublished = product.IsApproved || product.Status == ProductStatus.Published;

        if (!string.IsNullOrWhiteSpace(request.Title))
        {
            product.Title = request.Title.Trim();
            product.Slug = product.Title.ToLowerInvariant().Replace(" ", "-");
        }

        if (!string.IsNullOrWhiteSpace(request.Description))
        {
            product.Description = request.Description.Trim();
        }

        if (request.Price.HasValue)
        {
            product.Price = request.Price.Value;
        }

        if (!string.IsNullOrWhiteSpace(request.Condition) && Enum.TryParse<ProductCondition>(request.Condition, true, out var condition))
        {
            product.Condition = condition;
        }

        if (!string.IsNullOrWhiteSpace(request.ImageUrl))
        {
            product.ImageUrl = request.ImageUrl;
        }

        if (wasApprovedOrPublished)
        {
            product.IsApproved = false;
            product.Status = ProductStatus.Pending;
        }

        product.UpdatedAtUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return ProductDto.From(product, product.Category.Name);
    }
}
