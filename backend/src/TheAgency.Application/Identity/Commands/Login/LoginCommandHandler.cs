using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Identity.Common;

namespace TheAgency.Application.Identity.Commands.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, AuthenticationResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly ILogger<LoginCommandHandler> _logger;

    public LoginCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator,
        ILogger<LoginCommandHandler> logger)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
        _logger = logger;
    }

    public async Task<AuthenticationResult> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = EmailNormalizer.Normalize(request.Email);
        _logger.LogInformation("Processing login attempt for email: '{Email}' (Normalized: '{NormalizedEmail}')", request.Email, normalizedEmail);

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail || u.Email.ToLower() == normalizedEmail, cancellationToken);

        if (user == null)
        {
            _logger.LogWarning("Login failed: User with email '{Email}' (Normalized: '{NormalizedEmail}') not found in PostgreSQL.", request.Email, normalizedEmail);
            throw new UnauthorizedException("Invalid email or password.");
        }

        var isPasswordValid = _passwordHasher.VerifyPassword(request.Password, user.PasswordHash);
        if (!isPasswordValid)
        {
            _logger.LogWarning("Login failed: VerifyPassword returned false for user '{Email}'.", user.Email);
            throw new UnauthorizedException("Invalid email or password.");
        }

        if (!user.IsActive)
        {
            _logger.LogWarning("Login failed: Account '{Email}' is marked as inactive.", user.Email);
            throw new UnauthorizedException("Account is inactive.");
        }

        var issuedRefresh = _jwtTokenGenerator.IssueRefreshToken(user.Id);
        _context.RefreshTokens.Add(issuedRefresh.Entity);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Login successful for user '{Email}' (Role: {Role}, Id: {Id}).", user.Email, user.Role, user.Id);

        return new AuthenticationResult
        {
            User = UserDto.From(user),
            AccessToken = _jwtTokenGenerator.GenerateAccessToken(user),
            RefreshToken = issuedRefresh.PlainText
        };
    }
}
