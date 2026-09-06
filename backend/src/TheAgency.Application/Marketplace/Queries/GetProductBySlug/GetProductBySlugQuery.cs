using MediatR;
using TheAgency.Application.Marketplace.Common;

namespace TheAgency.Application.Marketplace.Queries.GetProductBySlug;

public sealed record GetProductBySlugQuery(string Slug) : IRequest<ProductDto>;
