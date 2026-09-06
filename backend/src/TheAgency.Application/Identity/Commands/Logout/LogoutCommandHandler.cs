using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Interfaces;

namespace TheAgency.Application.Identity.Commands.Logout;

public class LogoutCommandHandler : IRequestHandler<LogoutCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ITokenHasher _tokenHasher;

    public LogoutCommandHandler(IApplicationDbContext context, ITokenHasher tokenHasher)
    {
        _context = context;
        _tokenHasher = tokenHasher;
    }

    public async Task Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        var tokenHash = _tokenHasher.Hash(request.RefreshToken);

        var existingToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(r => r.Token == tokenHash, cancellationToken);

        if (existingToken == null || existingToken.RevokedAtUtc != null)
        {
            return;
        }

        existingToken.RevokedAtUtc = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
    }
}
