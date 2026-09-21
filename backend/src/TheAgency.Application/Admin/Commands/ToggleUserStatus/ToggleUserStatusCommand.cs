using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Identity.Common;

namespace TheAgency.Application.Admin.Commands.ToggleUserStatus;

public record ToggleUserStatusCommand(Guid TargetUserId, bool IsActive) : IRequest<UserDto>;

public sealed class ToggleUserStatusCommandHandler : IRequestHandler<ToggleUserStatusCommand, UserDto>
{
    private readonly IApplicationDbContext _context;

    public ToggleUserStatusCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserDto> Handle(ToggleUserStatusCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.Id == request.TargetUserId, cancellationToken);

        if (user is null)
        {
            throw new NotFoundException("User was not found.");
        }

        user.IsActive = request.IsActive;
        user.UpdatedAtUtc = DateTime.UtcNow;

        if (!request.IsActive)
        {
            foreach (var token in user.RefreshTokens.Where(t => t.RevokedAtUtc == null))
            {
                token.RevokedAtUtc = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return UserDto.From(user);
    }
}
