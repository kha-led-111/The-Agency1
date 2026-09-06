using System;
using System.Threading;
using System.Threading.Tasks;
using TheAgency.Domain.Entities;

namespace TheAgency.Application.Delivery.Services;

public interface ICourierAssignmentService
{
    Task<CourierProfile?> FindBestAvailableCourierAsync(string deliveryZone, CancellationToken cancellationToken = default);
}
