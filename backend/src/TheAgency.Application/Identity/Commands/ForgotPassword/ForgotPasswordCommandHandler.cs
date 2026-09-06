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

namespace TheAgency.Application.Identity.Commands.ForgotPassword;

public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly ITokenHasher _tokenHasher;
    private readonly IEmailSender _emailSender;
    private readonly IdentitySettings _identitySettings;

    public ForgotPasswordCommandHandler(
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

    public async Task Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = EmailNormalizer.Normalize(request.Email);

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail, cancellationToken);

        if (user == null || !user.IsActive)
        {
            return;
        }

        var existingTokens = await _context.AccountTokens
            .Where(t => t.UserId == user.Id
                        && t.Purpose == AccountTokenPurpose.PasswordReset
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
            Purpose = AccountTokenPurpose.PasswordReset,
            ExpiresAtUtc = DateTime.UtcNow.AddHours(_identitySettings.PasswordResetExpirationHours),
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(cancellationToken);

        await _emailSender.SendAsync(
            user.Email,
            "Reset your password",
            nameof(AccountTokenPurpose.PasswordReset),
            plaintext,
            cancellationToken);
    }
}
