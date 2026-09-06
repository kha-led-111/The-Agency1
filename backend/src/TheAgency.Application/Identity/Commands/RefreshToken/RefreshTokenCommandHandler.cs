using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Identity.Common;

namespace TheAgency.Application.Identity.Commands.RefreshToken;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthenticationResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly ITokenHasher _tokenHasher;

    public RefreshTokenCommandHandler(
        IApplicationDbContext context,
        IJwtTokenGenerator jwtTokenGenerator,
        ITokenHasher tokenHasher)
    {
        _context = context;
        _jwtTokenGenerator = jwtTokenGenerator;
        _tokenHasher = tokenHasher;
    }

    public async Task<AuthenticationResult> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var tokenHash = _tokenHasher.Hash(request.RefreshToken);

        var existingToken = await _context.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == tokenHash, cancellationToken);

        if (existingToken == null)
        {
            throw new UnauthorizedException("Invalid or expired refresh token.");
        }

        if (!existingToken.IsActive || existingToken.User == null || !existingToken.User.IsActive)
        {
            var userTokens = await _context.RefreshTokens
                .Where(t => t.UserId == existingToken.UserId && t.RevokedAtUtc == null)
                .ToListAsync(cancellationToken);

            foreach (var token in userTokens)
            {
                token.RevokedAtUtc = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedException("Invalid or expired refresh token.");
        }

        existingToken.RevokedAtUtc = DateTime.UtcNow;

        var issuedRefresh = _jwtTokenGenerator.IssueRefreshToken(existingToken.UserId);
        _context.RefreshTokens.Add(issuedRefresh.Entity);

        await _context.SaveChangesAsync(cancellationToken);

        return new AuthenticationResult
        {
            User = UserDto.From(existingToken.User),
            AccessToken = _jwtTokenGenerator.GenerateAccessToken(existingToken.User),
            RefreshToken = issuedRefresh.PlainText
        };
    }
}
