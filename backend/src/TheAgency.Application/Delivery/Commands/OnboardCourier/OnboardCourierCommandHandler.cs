using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Delivery.Common;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Delivery.Commands.OnboardCourier;

public sealed class OnboardCourierCommandHandler : IRequestHandler<OnboardCourierCommand, CourierProfileDto>
{
    private readonly IApplicationDbContext _context;

    public OnboardCourierCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CourierProfileDto> Handle(OnboardCourierCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
        if (user is null)
        {
            throw new NotFoundException("User was not found.");
        }

        user.Role = UserRole.Courier;
        user.UpdatedAtUtc = DateTime.UtcNow;

        var profile = await _context.CourierProfiles.FirstOrDefaultAsync(p => p.UserId == request.UserId, cancellationToken);
        if (profile is null)
        {
            profile = new CourierProfile
            {
                UserId = request.UserId,
                VehicleType = request.VehicleType,
                DeliveryZone = request.DeliveryZone,
                IsAvailable = true,
                CreatedAtUtc = DateTime.UtcNow
            };
            _context.CourierProfiles.Add(profile);
        }
        else
        {
            profile.VehicleType = request.VehicleType;
            profile.DeliveryZone = request.DeliveryZone;
            profile.IsAvailable = true;
            profile.UpdatedAtUtc = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return CourierProfileDto.From(profile);
    }
}
