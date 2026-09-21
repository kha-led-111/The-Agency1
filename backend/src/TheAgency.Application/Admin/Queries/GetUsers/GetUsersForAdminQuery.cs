using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Identity.Common;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Admin.Queries.GetUsers;

public record GetUsersForAdminQuery(
    string? Search = null,
    UserRole? Role = null,
    bool? IsActive = null
) : IRequest<IReadOnlyList<UserDto>>;

public sealed class GetUsersForAdminQueryHandler : IRequestHandler<GetUsersForAdminQuery, IReadOnlyList<UserDto>>
{
    private readonly IApplicationDbContext _context;

    public GetUsersForAdminQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<UserDto>> Handle(GetUsersForAdminQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(u =>
                u.FirstName.ToLower().Contains(search) ||
                u.LastName.ToLower().Contains(search) ||
                u.Email.ToLower().Contains(search) ||
                u.PhoneNumber.Contains(search));
        }

        if (request.Role.HasValue)
        {
            query = query.Where(u => u.Role == request.Role.Value);
        }

        if (request.IsActive.HasValue)
        {
            query = query.Where(u => u.IsActive == request.IsActive.Value);
        }

        var users = await query
            .OrderByDescending(u => u.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return users.Select(UserDto.From).ToList();
    }
}
