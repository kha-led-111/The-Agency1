using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using NSubstitute;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Identity;
using TheAgency.Application.Identity.Commands.Register;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;
using TheAgency.Infrastructure.Persistence;
using Xunit;

namespace TheAgency.Tests.Unit.Identity;

public class RegisterCommandHandlerTests
{
    private readonly ApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly ITokenHasher _tokenHasher;
    private readonly IEmailSender _emailSender;
    private readonly RegisterCommandHandler _sut;

    public RegisterCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _passwordHasher = Substitute.For<IPasswordHasher>();
        _jwtTokenGenerator = Substitute.For<IJwtTokenGenerator>();
        _tokenHasher = Substitute.For<ITokenHasher>();
        _emailSender = Substitute.For<IEmailSender>();

        _passwordHasher.HashPassword(Arg.Any<string>()).Returns("hashed_password");
        _tokenHasher.CreatePlaintextToken().Returns("verify-token");
        _tokenHasher.Hash(Arg.Any<string>()).Returns("hashed-token");
        _jwtTokenGenerator.GenerateAccessToken(Arg.Any<User>()).Returns("access_token");
        _jwtTokenGenerator.IssueRefreshToken(Arg.Any<Guid>()).Returns(callInfo => new IssuedRefreshToken
        {
            PlainText = "refresh_token",
            Entity = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = callInfo.Arg<Guid>(),
                Token = "hashed-refresh",
                ExpiresAtUtc = DateTime.UtcNow.AddDays(7)
            }
        });

        _sut = new RegisterCommandHandler(
            _context,
            _passwordHasher,
            _jwtTokenGenerator,
            _tokenHasher,
            _emailSender,
            Options.Create(new IdentitySettings { ReturnEmailTokensInResponses = true }));
    }

    [Fact]
    public async Task Handle_WithValidCommand_ShouldCreateBuyerAndReturnTokens()
    {
        var command = new RegisterCommand("newuser@example.com", "Password123!", "Jane", "Doe", "1234567890");

        var result = await _sut.Handle(command, CancellationToken.None);

        result.AccessToken.Should().Be("access_token");
        result.RefreshToken.Should().Be("refresh_token");
        result.User.Email.Should().Be("newuser@example.com");
        result.User.Role.Should().Be(UserRole.Buyer);
        result.EmailVerificationToken.Should().Be("verify-token");

        var dbUser = await _context.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == "newuser@example.com");
        dbUser.Should().NotBeNull();
        dbUser!.PasswordHash.Should().Be("hashed_password");
        dbUser.Role.Should().Be(UserRole.Buyer);
    }

    [Fact]
    public async Task Handle_WithDuplicateEmail_ShouldThrowConflictException()
    {
        _context.Users.Add(new User
        {
            Email = "existing@example.com",
            NormalizedEmail = "existing@example.com",
            PasswordHash = "hash"
        });
        await _context.SaveChangesAsync();

        var command = new RegisterCommand("Existing@example.com", "Password123!", "Jane", "Doe", "1234567890");

        var act = async () => await _sut.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*already exists*");
    }
}
