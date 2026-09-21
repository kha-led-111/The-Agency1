using System;
using MediatR;
using TheAgency.Application.Marketplace.Common;

namespace TheAgency.Application.Marketplace.Commands.CreateProduct;

public sealed record CreateProductCommand(
    Guid SellerId,
    string Title,
    string Description,
    decimal Price,
    string Condition,
    Guid CategoryId,
    string? ImageUrl,
    string? Location = null,
    Guid? SubcategoryId = null,
    string? Size = null,
    string? Governorate = null,
    string? City = null,
    System.Collections.Generic.IReadOnlyList<string>? ImageUrls = null) : IRequest<ProductDto>;

