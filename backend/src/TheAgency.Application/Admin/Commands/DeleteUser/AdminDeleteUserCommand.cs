using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;

namespace TheAgency.Application.Admin.Commands.DeleteUser;

public record AdminDeleteUserCommand(Guid TargetUserId, Guid AdminUserId) : IRequest<bool>;

public sealed class AdminDeleteUserCommandHandler : IRequestHandler<AdminDeleteUserCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public AdminDeleteUserCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(AdminDeleteUserCommand request, CancellationToken cancellationToken)
    {
        if (request.TargetUserId == request.AdminUserId)
        {
            throw new InvalidOperationException("Admin cannot delete their own account from the management portal.");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.TargetUserId, cancellationToken);

        if (user is null)
        {
            throw new NotFoundException("User account was not found.");
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
