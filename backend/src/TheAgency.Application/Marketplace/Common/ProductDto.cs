using System;
using System.Collections.Generic;
using System.Linq;
using TheAgency.Domain.Entities;

namespace TheAgency.Application.Marketplace.Common;

public sealed record ProductImageDto(Guid Id, string ImageUrl, bool IsMain, int DisplayOrder);

public sealed class ProductDto
{
    public Guid Id { get; set; }
    public Guid SellerId { get; set; }
    public Guid CategoryId { get; set; }
    public Guid? SubcategoryId { get; set; }
    public string? Size { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Condition { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
    public IReadOnlyList<ProductImageDto> Images { get; set; } = Array.Empty<ProductImageDto>();

    public static ProductDto From(Product product, string categoryName)
    {
        var imageDtos = product.Images != null && product.Images.Count > 0
            ? product.Images.OrderBy(i => i.DisplayOrder).Select(i => new ProductImageDto(i.Id, i.ImageUrl, i.IsMain, i.DisplayOrder)).ToList()
            : !string.IsNullOrWhiteSpace(product.ImageUrl)
                ? new List<ProductImageDto> { new ProductImageDto(Guid.Empty, product.ImageUrl, true, 0) }
                : new List<ProductImageDto>();

        var mainImageUrl = imageDtos.FirstOrDefault(i => i.IsMain)?.ImageUrl ?? product.ImageUrl ?? imageDtos.FirstOrDefault()?.ImageUrl;

        return new ProductDto
        {
            Id = product.Id,
            SellerId = product.SellerId,
            CategoryId = product.CategoryId,
            SubcategoryId = product.SubcategoryId,
            Size = product.Size,
            Title = product.Title,
            Slug = product.Slug,
            Description = product.Description,
            Price = product.Price,
            Condition = product.Condition.ToString(),
            Status = product.Status.ToString(),
            ImageUrl = mainImageUrl,
            CategoryName = categoryName,
            CreatedAtUtc = product.CreatedAtUtc,
            Images = imageDtos
        };
    }
}
