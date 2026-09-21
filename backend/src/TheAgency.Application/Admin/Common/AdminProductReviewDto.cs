using System;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Admin.Common;

public class AdminProductReviewDto
{
    public Guid Id { get; set; }
    public Guid SellerId { get; set; }
    public string SellerName { get; set; } = string.Empty;
    public string SellerEmail { get; set; } = string.Empty;
    public string SellerPhone { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public ProductCondition Condition { get; set; }
    public ProductStatus Status { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsApproved { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }

    public static AdminProductReviewDto From(Product product) => new()
    {
        Id = product.Id,
        SellerId = product.SellerId,
        SellerName = product.Seller != null ? $"{product.Seller.FirstName} {product.Seller.LastName}".Trim() : "غير معروف",
        SellerEmail = product.Seller?.Email ?? string.Empty,
        SellerPhone = product.Seller?.PhoneNumber ?? string.Empty,
        CategoryId = product.CategoryId,
        CategoryName = product.Category?.Name ?? string.Empty,
        Title = product.Title,
        Slug = product.Slug,
        Description = product.Description,
        Price = product.Price,
        Condition = product.Condition,
        Status = product.Status,
        ImageUrl = product.ImageUrl,
        IsApproved = product.IsApproved,
        ApprovedAt = product.ApprovedAt,
        CreatedAtUtc = product.CreatedAtUtc,
        UpdatedAtUtc = product.UpdatedAtUtc
    };
}
