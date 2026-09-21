using System;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Marketplace.Common;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Marketplace.Commands.CreateProduct;

public sealed class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, ProductDto>
{
    private readonly IApplicationDbContext _context;

    public CreateProductCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ProductDto> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(x => x.Id == request.CategoryId && x.IsActive, cancellationToken);

        if (category is null)
        {
            throw new NotFoundException("Category was not found.");
        }

        if (!Enum.TryParse<ProductCondition>(request.Condition, true, out var condition))
        {
            throw new ValidationException("Condition is invalid.");
        }

        var title = request.Title.Trim();
        var slug = CreateSlug(title);

        var mainImageUrl = request.ImageUrl;
        var imageUrlList = new System.Collections.Generic.List<string>();

        if (request.ImageUrls != null && request.ImageUrls.Count > 0)
        {
            foreach (var url in request.ImageUrls)
            {
                if (!string.IsNullOrWhiteSpace(url) && !imageUrlList.Contains(url))
                {
                    imageUrlList.Add(url.Trim());
                }
            }
        }

        if (!string.IsNullOrWhiteSpace(request.ImageUrl) && !imageUrlList.Contains(request.ImageUrl.Trim()))
        {
            imageUrlList.Insert(0, request.ImageUrl.Trim());
        }

        if (string.IsNullOrWhiteSpace(mainImageUrl) && imageUrlList.Count > 0)
        {
            mainImageUrl = imageUrlList[0];
        }

        var product = new Product
        {
            SellerId = request.SellerId,
            CategoryId = request.CategoryId,
            SubcategoryId = request.SubcategoryId,
            Size = request.Size,
            Title = title,
            Slug = slug,
            Description = request.Description.Trim(),
            Price = request.Price,
            Condition = condition,
            Status = ProductStatus.Pending,
            ImageUrl = mainImageUrl,
            CreatedAtUtc = DateTime.UtcNow,
            IsApproved = false
        };

        for (int i = 0; i < imageUrlList.Count; i++)
        {
            var imgUrl = imageUrlList[i];
            var isMain = i == 0;
            var productImage = new ProductImage
            {
                ProductId = product.Id,
                ImageUrl = imgUrl,
                IsMain = isMain,
                DisplayOrder = i,
                CreatedAtUtc = DateTime.UtcNow
            };
            product.Images.Add(productImage);
            _context.ProductImages.Add(productImage);
        }

        _context.Products.Add(product);
        await _context.SaveChangesAsync(cancellationToken);

        return ProductDto.From(product, category.Name);
    }

    private static string CreateSlug(string input)
    {
        var slug = Regex.Replace(input.Trim(), "[^a-zA-Z0-9]+", "-").Trim('-').ToLowerInvariant();
        return string.IsNullOrWhiteSpace(slug) ? $"product-{Guid.NewGuid():N}" : slug;
    }
}
