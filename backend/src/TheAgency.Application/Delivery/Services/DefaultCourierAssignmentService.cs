using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Domain.Entities;

namespace TheAgency.Application.Delivery.Services;

public class DefaultCourierAssignmentService : ICourierAssignmentService
{
    private readonly IApplicationDbContext _context;

    public DefaultCourierAssignmentService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CourierProfile?> FindBestAvailableCourierAsync(string deliveryZone, CancellationToken cancellationToken = default)
    {
        // First try matching zone
        var courier = await _context.CourierProfiles
            .Include(c => c.User)
            .Where(c => c.IsAvailable && c.User.IsActive && c.DeliveryZone == deliveryZone)
            .OrderBy(c => c.ActiveDeliveriesCount)
            .ThenByDescending(c => c.Rating)
            .FirstOrDefaultAsync(cancellationToken);

        // Fallback to any available courier if no zone match
        courier ??= await _context.CourierProfiles
            .Include(c => c.User)
            .Where(c => c.IsAvailable && c.User.IsActive)
            .OrderBy(c => c.ActiveDeliveriesCount)
            .ThenByDescending(c => c.Rating)
            .FirstOrDefaultAsync(cancellationToken);

        return courier;
    }
}
