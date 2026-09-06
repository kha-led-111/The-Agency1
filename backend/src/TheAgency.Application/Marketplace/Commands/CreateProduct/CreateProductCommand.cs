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
    string? ImageUrl) : IRequest<ProductDto>;
