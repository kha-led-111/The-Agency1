using System;
using System.Collections.Generic;

namespace TheAgency.Application.Marketplace.Common;

public sealed record CreateProductRequest(
    string Title,
    string Description,
    decimal Price,
    string Condition,
    Guid CategoryId,
    string? ImageUrl = null,
    string? Governorate = null,
    string? City = null,
    string? Location = null,
    IReadOnlyList<string>? ImageUrls = null);

public sealed record UpdateProductRequest(
    string? Title = null,
    string? Description = null,
    decimal? Price = null,
    string? Condition = null,
    string? Status = null,
    string? ImageUrl = null,
    string? Governorate = null,
    string? City = null,
    string? Location = null,
    IReadOnlyList<string>? ImageUrls = null);
