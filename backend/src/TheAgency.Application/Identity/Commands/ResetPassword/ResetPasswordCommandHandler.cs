using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Identity.Commands.ResetPassword;

public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ITokenHasher _tokenHasher;
    private readonly IPasswordHasher _passwordHasher;

    public ResetPasswordCommandHandler(
        IApplicationDbContext context,
        ITokenHasher tokenHasher,
        IPasswordHasher passwordHasher)
    {
        _context = context;
        _tokenHasher = tokenHasher;
        _passwordHasher = passwordHasher;
    }

    public async Task Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var tokenHash = _tokenHasher.Hash(request.Token);

        var accountToken = await _context.AccountTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(
                t => t.TokenHash == tokenHash && t.Purpose == AccountTokenPurpose.PasswordReset,
                cancellationToken);

        if (accountToken == null || !accountToken.IsActive || accountToken.User == null)
        {
            throw new UnauthorizedException("Invalid or expired reset token.");
        }

        accountToken.UsedAtUtc = DateTime.UtcNow;
        accountToken.User.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        accountToken.User.UpdatedAtUtc = DateTime.UtcNow;

        var refreshTokens = await _context.RefreshTokens
            .Where(t => t.UserId == accountToken.UserId && t.RevokedAtUtc == null)
            .ToListAsync(cancellationToken);

        foreach (var refreshToken in refreshTokens)
        {
            refreshToken.RevokedAtUtc = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}
