using System;
using System.Collections.Generic;
using MediatR;
using TheAgency.Application.Marketplace.Common;

namespace TheAgency.Application.Marketplace.Queries.Favorites;

public sealed record GetMyFavoritesQuery(Guid UserId) : IRequest<IReadOnlyList<ProductDto>>;
