using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Delivery.Common;

namespace TheAgency.Application.Delivery.Commands.UpdateAvailability;

public sealed class UpdateCourierAvailabilityCommandHandler : IRequestHandler<UpdateCourierAvailabilityCommand, CourierProfileDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateCourierAvailabilityCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CourierProfileDto> Handle(UpdateCourierAvailabilityCommand request, CancellationToken cancellationToken)
    {
        var profile = await _context.CourierProfiles.FirstOrDefaultAsync(p => p.UserId == request.UserId, cancellationToken);
        if (profile is null)
        {
            throw new NotFoundException("Courier profile was not found.");
        }

        profile.IsAvailable = request.IsAvailable;
        profile.UpdatedAtUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return CourierProfileDto.From(profile);
    }
}
