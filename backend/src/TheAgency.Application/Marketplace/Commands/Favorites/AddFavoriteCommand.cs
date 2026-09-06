using System;
using MediatR;

namespace TheAgency.Application.Marketplace.Commands.Favorites;

public sealed record AddFavoriteCommand(Guid UserId, Guid ProductId) : IRequest<bool>;
