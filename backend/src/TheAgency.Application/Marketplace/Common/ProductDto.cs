using System;
using TheAgency.Domain.Entities;

namespace TheAgency.Application.Marketplace.Common;

public sealed class ProductDto
{
    public Guid Id { get; set; }
    public Guid SellerId { get; set; }
    public Guid CategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Condition { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }

    public static ProductDto From(Product product, string categoryName)
    {
        return new ProductDto
        {
            Id = product.Id,
            SellerId = product.SellerId,
            CategoryId = product.CategoryId,
            Title = product.Title,
            Slug = product.Slug,
            Description = product.Description,
            Price = product.Price,
            Condition = product.Condition.ToString(),
            Status = product.Status.ToString(),
            ImageUrl = product.ImageUrl,
            CategoryName = categoryName,
            CreatedAtUtc = product.CreatedAtUtc
        };
    }
}
