using System;
using TheAgency.Domain.Enums;

namespace TheAgency.Domain.Entities;

public class Product
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SellerId { get; set; }
    public Guid CategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public ProductCondition Condition { get; set; } = ProductCondition.Excellent;
    public ProductStatus Status { get; set; } = ProductStatus.Draft;
    public string? ImageUrl { get; set; }
    public bool IsApproved { get; set; }
    public Guid? BuyerId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }

    public User Seller { get; set; } = default!;
    public User? Buyer { get; set; }
    public Category Category { get; set; } = default!;
}
