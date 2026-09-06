using System.Collections.Generic;
using MediatR;
using TheAgency.Application.Marketplace.Common;

namespace TheAgency.Application.Marketplace.Queries.GetCategories;

public sealed record GetCategoriesQuery() : IRequest<IReadOnlyList<CategoryDto>>;
