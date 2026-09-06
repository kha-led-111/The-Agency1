using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Identity.Common;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Identity.Commands.ResendVerification;

public class ResendVerificationCommandHandler : IRequestHandler<ResendVerificationCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ITokenHasher _tokenHasher;
    private readonly IEmailSender _emailSender;
    private readonly IdentitySettings _identitySettings;

    public ResendVerificationCommandHandler(
        IApplicationDbContext context,
        ITokenHasher tokenHasher,
        IEmailSender emailSender,
        IOptions<IdentitySettings> identitySettings)
    {
        _context = context;
        _tokenHasher = tokenHasher;
        _emailSender = emailSender;
        _identitySettings = identitySettings.Value;
    }

    public async Task Handle(ResendVerificationCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = EmailNormalizer.Normalize(request.Email);

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail, cancellationToken);

        if (user == null || !user.IsActive || user.IsEmailVerified)
        {
            return;
        }

        var existingTokens = await _context.AccountTokens
            .Where(t => t.UserId == user.Id
                        && t.Purpose == AccountTokenPurpose.EmailVerification
                        && t.UsedAtUtc == null)
            .ToListAsync(cancellationToken);

        foreach (var token in existingTokens)
        {
            token.UsedAtUtc = DateTime.UtcNow;
        }

        var plaintext = _tokenHasher.CreatePlaintextToken();
        _context.AccountTokens.Add(new AccountToken
        {
            UserId = user.Id,
            TokenHash = _tokenHasher.Hash(plaintext),
            Purpose = AccountTokenPurpose.EmailVerification,
            ExpiresAtUtc = DateTime.UtcNow.AddHours(_identitySettings.EmailVerificationExpirationHours),
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(cancellationToken);

        await _emailSender.SendAsync(
            user.Email,
            "Verify your email",
            nameof(AccountTokenPurpose.EmailVerification),
            plaintext,
            cancellationToken);
    }
}
