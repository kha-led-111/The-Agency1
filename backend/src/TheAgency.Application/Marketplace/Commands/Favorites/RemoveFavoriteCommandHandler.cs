using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Interfaces;

namespace TheAgency.Application.Marketplace.Commands.Favorites;

public sealed class RemoveFavoriteCommandHandler : IRequestHandler<RemoveFavoriteCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public RemoveFavoriteCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(RemoveFavoriteCommand request, CancellationToken cancellationToken)
    {
        var existing = await _context.Favorites
            .FirstOrDefaultAsync(x => x.UserId == request.UserId && x.ProductId == request.ProductId, cancellationToken);

        if (existing is null)
        {
            return true;
        }

        _context.Favorites.Remove(existing);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
