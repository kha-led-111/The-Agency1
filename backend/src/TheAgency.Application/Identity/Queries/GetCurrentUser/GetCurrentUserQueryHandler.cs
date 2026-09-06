using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Identity.Common;

namespace TheAgency.Application.Identity.Queries.GetCurrentUser;

public class GetCurrentUserQueryHandler : IRequestHandler<GetCurrentUserQuery, UserDto>
{
    private readonly IApplicationDbContext _context;

    public GetCurrentUserQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserDto> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException("User was not found.");
        }

        return UserDto.From(user);
    }
}
