using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Identity.Common;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Identity.Commands.Register;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, AuthenticationResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly ITokenHasher _tokenHasher;
    private readonly IEmailSender _emailSender;
    private readonly IdentitySettings _identitySettings;

    public RegisterCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator,
        ITokenHasher tokenHasher,
        IEmailSender emailSender,
        IOptions<IdentitySettings> identitySettings)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
        _tokenHasher = tokenHasher;
        _emailSender = emailSender;
        _identitySettings = identitySettings.Value;
    }

    public async Task<AuthenticationResult> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = EmailNormalizer.Normalize(request.Email);

        var existingUser = await _context.Users
            .AnyAsync(u => u.NormalizedEmail == normalizedEmail || u.Email.ToLower() == normalizedEmail, cancellationToken);

        if (existingUser)
        {
            throw new ConflictException("A user with this email address already exists.");
        }

        var user = new User
        {
            Email = request.Email.Trim(),
            NormalizedEmail = normalizedEmail,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            PhoneNumber = request.PhoneNumber?.Trim() ?? string.Empty,
            Role = UserRole.Buyer,
            IsActive = true,
            EmailVerifiedAtUtc = null,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.Users.Add(user);

        var issuedRefresh = _jwtTokenGenerator.IssueRefreshToken(user.Id);
        _context.RefreshTokens.Add(issuedRefresh.Entity);

        var verificationPlaintext = _tokenHasher.CreatePlaintextToken();
        _context.AccountTokens.Add(new AccountToken
        {
            UserId = user.Id,
            TokenHash = _tokenHasher.Hash(verificationPlaintext),
            Purpose = AccountTokenPurpose.EmailVerification,
            ExpiresAtUtc = DateTime.UtcNow.AddHours(_identitySettings.EmailVerificationExpirationHours),
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(cancellationToken);

        await _emailSender.SendAsync(
            user.Email,
            "Verify your email",
            nameof(AccountTokenPurpose.EmailVerification),
            verificationPlaintext,
            cancellationToken);

        var accessToken = _jwtTokenGenerator.GenerateAccessToken(user);

        return new AuthenticationResult
        {
            User = UserDto.From(user),
            AccessToken = accessToken,
            RefreshToken = issuedRefresh.PlainText,
            EmailVerificationToken = _identitySettings.ReturnEmailTokensInResponses
                ? verificationPlaintext
                : null
        };
    }
}
