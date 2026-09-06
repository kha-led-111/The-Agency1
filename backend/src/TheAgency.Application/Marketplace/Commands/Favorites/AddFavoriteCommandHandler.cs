using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Domain.Entities;

namespace TheAgency.Application.Marketplace.Commands.Favorites;

public sealed class AddFavoriteCommandHandler : IRequestHandler<AddFavoriteCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public AddFavoriteCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(AddFavoriteCommand request, CancellationToken cancellationToken)
    {
        var product = await _context.Products.FirstOrDefaultAsync(x => x.Id == request.ProductId, cancellationToken);
        if (product is null)
        {
            throw new NotFoundException("Product was not found.");
        }

        var existing = await _context.Favorites
            .FirstOrDefaultAsync(x => x.UserId == request.UserId && x.ProductId == request.ProductId, cancellationToken);

        if (existing is not null)
        {
            return true;
        }

        var favorite = new Favorite
        {
            UserId = request.UserId,
            ProductId = request.ProductId,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.Favorites.Add(favorite);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
