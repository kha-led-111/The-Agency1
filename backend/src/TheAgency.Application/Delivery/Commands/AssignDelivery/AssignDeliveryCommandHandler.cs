using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Delivery.Common;
using TheAgency.Application.Delivery.Services;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Delivery.Commands.AssignDelivery;

public sealed class AssignDeliveryCommandHandler : IRequestHandler<AssignDeliveryCommand, DeliveryTaskDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICourierAssignmentService _assignmentService;

    public AssignDeliveryCommandHandler(IApplicationDbContext context, ICourierAssignmentService assignmentService)
    {
        _context = context;
        _assignmentService = assignmentService;
    }

    public async Task<DeliveryTaskDto> Handle(AssignDeliveryCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order is null)
        {
            throw new NotFoundException("Order was not found.");
        }

        var deliveryTask = await _context.DeliveryTasks
            .Include(d => d.TrackingEvents)
            .FirstOrDefaultAsync(d => d.OrderId == request.OrderId, cancellationToken);

        if (deliveryTask is null)
        {
            deliveryTask = new DeliveryTask
            {
                OrderId = order.Id,
                PickupAddress = "Seller Warehouse / Address",
                DeliveryAddress = order.ShippingAddress,
                Status = DeliveryStatus.PendingAssignment,
                CreatedAtUtc = DateTime.UtcNow
            };
            _context.DeliveryTasks.Add(deliveryTask);
        }

        CourierProfile? selectedCourierProfile = null;

        if (request.RequestedCourierId.HasValue)
        {
            selectedCourierProfile = await _context.CourierProfiles
                .FirstOrDefaultAsync(c => c.UserId == request.RequestedCourierId.Value, cancellationToken);
        }
        else
        {
            selectedCourierProfile = await _assignmentService.FindBestAvailableCourierAsync("Cairo Central", cancellationToken);
        }

        if (selectedCourierProfile is null)
        {
            throw new ValidationException("No available courier could be assigned at this time.");
        }

        deliveryTask.CourierId = selectedCourierProfile.UserId;
        deliveryTask.Status = DeliveryStatus.Assigned;
        deliveryTask.AssignedAtUtc = DateTime.UtcNow;
        deliveryTask.UpdatedAtUtc = DateTime.UtcNow;

        selectedCourierProfile.ActiveDeliveriesCount += 1;
        selectedCourierProfile.UpdatedAtUtc = DateTime.UtcNow;

        var trackingEvent = new DeliveryTrackingEvent
        {
            DeliveryTaskId = deliveryTask.Id,
            Status = DeliveryStatus.Assigned,
            Note = $"Courier assigned to delivery task.",
            TimestampUtc = DateTime.UtcNow
        };

        _context.DeliveryTrackingEvents.Add(trackingEvent);

        await _context.SaveChangesAsync(cancellationToken);

        deliveryTask.TrackingEvents.Add(trackingEvent);
        return DeliveryTaskDto.From(deliveryTask);
    }
}
