using System;
using MediatR;
using TheAgency.Application.Common.Models;
using TheAgency.Application.Marketplace.Common;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Marketplace.Queries.GetProducts;

public sealed record GetProductsQuery(
    string? Search = null,
    Guid? CategoryId = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    ProductCondition? Condition = null,
    string? SortBy = null,
    int PageNumber = 1,
    int PageSize = 12
) : IRequest<PagedResult<ProductDto>>;
