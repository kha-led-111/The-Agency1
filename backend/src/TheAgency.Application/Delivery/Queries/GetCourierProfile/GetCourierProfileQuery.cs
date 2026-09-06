using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Delivery.Common;

namespace TheAgency.Application.Delivery.Queries.GetCourierProfile;

public sealed record GetCourierProfileQuery(Guid UserId) : IRequest<CourierProfileDto>;

public sealed class GetCourierProfileQueryHandler : IRequestHandler<GetCourierProfileQuery, CourierProfileDto>
{
    private readonly IApplicationDbContext _context;

    public GetCourierProfileQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CourierProfileDto> Handle(GetCourierProfileQuery request, CancellationToken cancellationToken)
    {
        var profile = await _context.CourierProfiles.FirstOrDefaultAsync(p => p.UserId == request.UserId, cancellationToken);
        if (profile is null)
        {
            throw new NotFoundException("Courier profile was not found.");
        }

        return CourierProfileDto.From(profile);
    }
}
