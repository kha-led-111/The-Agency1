using System;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Delivery.Common;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Delivery.Commands.UpdateDeliveryStatus;

public sealed class UpdateDeliveryTaskStatusCommandHandler : IRequestHandler<UpdateDeliveryTaskStatusCommand, DeliveryTaskDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateDeliveryTaskStatusCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DeliveryTaskDto> Handle(UpdateDeliveryTaskStatusCommand request, CancellationToken cancellationToken)
    {
        var deliveryTask = await _context.DeliveryTasks
            .Include(d => d.Order)
            .Include(d => d.TrackingEvents)
            .FirstOrDefaultAsync(d => d.Id == request.DeliveryTaskId, cancellationToken);

        if (deliveryTask is null)
        {
            throw new NotFoundException("Delivery task was not found.");
        }

        // BOLA / Authorization Check: Courier assigned or Admin
        var isAssignedCourier = deliveryTask.CourierId == request.RequestUserId;
        var isAdmin = request.RequestUserRole == UserRole.Admin;

        if (!isAssignedCourier && !isAdmin)
        {
            throw new UnauthorizedException("You are not authorized to update this delivery task.");
        }

        deliveryTask.Status = request.NewStatus;
        deliveryTask.UpdatedAtUtc = DateTime.UtcNow;

        if (request.NewStatus == DeliveryStatus.PickedUp)
        {
            deliveryTask.PickedUpAtUtc = DateTime.UtcNow;
            if (deliveryTask.Order is not null)
            {
                deliveryTask.Order.Status = OrderStatus.OutForDelivery;
                deliveryTask.Order.UpdatedAtUtc = DateTime.UtcNow;
            }
        }
        else if (request.NewStatus == DeliveryStatus.OutForDelivery)
        {
            if (deliveryTask.Order is not null)
            {
                deliveryTask.Order.Status = OrderStatus.OutForDelivery;
                deliveryTask.Order.UpdatedAtUtc = DateTime.UtcNow;
            }
        }
        else if (request.NewStatus == DeliveryStatus.Delivered)
        {
            deliveryTask.DeliveredAtUtc = DateTime.UtcNow;
            if (deliveryTask.Order is not null)
            {
                deliveryTask.Order.Status = OrderStatus.Delivered;
                deliveryTask.Order.UpdatedAtUtc = DateTime.UtcNow;
            }
            await DecrementActiveDeliveriesAsync(deliveryTask.CourierId, cancellationToken);
        }
        else if (request.NewStatus == DeliveryStatus.Failed)
        {
            deliveryTask.FailureReason = request.FailureReason ?? "Delivery attempt failed.";
            if (deliveryTask.Order is not null)
            {
                deliveryTask.Order.Status = OrderStatus.FailedDelivery;
                deliveryTask.Order.UpdatedAtUtc = DateTime.UtcNow;
            }
            await DecrementActiveDeliveriesAsync(deliveryTask.CourierId, cancellationToken);
        }

        var trackingEvent = new DeliveryTrackingEvent
        {
            DeliveryTaskId = deliveryTask.Id,
            Status = request.NewStatus,
            Note = request.Note ?? $"Delivery status updated to {request.NewStatus}.",
            TimestampUtc = DateTime.UtcNow
        };

        _context.DeliveryTrackingEvents.Add(trackingEvent);

        await _context.SaveChangesAsync(cancellationToken);

        deliveryTask.TrackingEvents.Add(trackingEvent);
        return DeliveryTaskDto.From(deliveryTask);
    }

    private async Task DecrementActiveDeliveriesAsync(Guid? courierUserId, CancellationToken cancellationToken)
    {
        if (courierUserId.HasValue)
        {
            var profile = await _context.CourierProfiles.FirstOrDefaultAsync(p => p.UserId == courierUserId.Value, cancellationToken);
            if (profile is not null && profile.ActiveDeliveriesCount > 0)
            {
                profile.ActiveDeliveriesCount -= 1;
                profile.UpdatedAtUtc = DateTime.UtcNow;
            }
        }
    }
}
