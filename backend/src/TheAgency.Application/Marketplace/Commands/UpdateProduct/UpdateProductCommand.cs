using System;
using MediatR;
using TheAgency.Application.Marketplace.Common;

namespace TheAgency.Application.Marketplace.Commands.UpdateProduct;

public sealed record UpdateProductCommand(
    Guid ProductId,
    Guid SellerId,
    string? Title,
    string? Description,
    decimal? Price,
    string? Condition,
    string? Status,
    string? ImageUrl) : IRequest<ProductDto>;
