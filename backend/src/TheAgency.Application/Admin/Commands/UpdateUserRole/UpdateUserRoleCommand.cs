using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Identity.Common;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Admin.Commands.UpdateUserRole;

public record UpdateUserRoleCommand(Guid TargetUserId, UserRole NewRole) : IRequest<UserDto>;

public sealed class UpdateUserRoleCommandHandler : IRequestHandler<UpdateUserRoleCommand, UserDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateUserRoleCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserDto> Handle(UpdateUserRoleCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.TargetUserId, cancellationToken);

        if (user is null)
        {
            throw new NotFoundException("User was not found.");
        }

        user.Role = request.NewRole;
        user.UpdatedAtUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return UserDto.From(user);
    }
}
