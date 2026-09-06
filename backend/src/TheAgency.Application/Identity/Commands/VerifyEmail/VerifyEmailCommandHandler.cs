using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Identity.Commands.VerifyEmail;

public class VerifyEmailCommandHandler : IRequestHandler<VerifyEmailCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ITokenHasher _tokenHasher;

    public VerifyEmailCommandHandler(IApplicationDbContext context, ITokenHasher tokenHasher)
    {
        _context = context;
        _tokenHasher = tokenHasher;
    }

    public async Task Handle(VerifyEmailCommand request, CancellationToken cancellationToken)
    {
        var tokenHash = _tokenHasher.Hash(request.Token);

        var accountToken = await _context.AccountTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(
                t => t.TokenHash == tokenHash && t.Purpose == AccountTokenPurpose.EmailVerification,
                cancellationToken);

        if (accountToken == null || !accountToken.IsActive || accountToken.User == null)
        {
            throw new UnauthorizedException("Invalid or expired verification token.");
        }

        accountToken.UsedAtUtc = DateTime.UtcNow;
        accountToken.User.EmailVerifiedAtUtc = DateTime.UtcNow;
        accountToken.User.UpdatedAtUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
    }
}
