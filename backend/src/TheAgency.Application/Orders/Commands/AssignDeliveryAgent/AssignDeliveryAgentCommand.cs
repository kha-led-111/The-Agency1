using System;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Orders.Common;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Orders.Commands.AssignDeliveryAgent;

public record AssignDeliveryAgentCommand(
    Guid OrderId,
    Guid DeliveryAgentId,
    string? Notes = null
) : IRequest<OrderDto>;

public sealed class AssignDeliveryAgentCommandHandler : IRequestHandler<AssignDeliveryAgentCommand, OrderDto>
{
    private readonly IApplicationDbContext _context;

    public AssignDeliveryAgentCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OrderDto> Handle(AssignDeliveryAgentCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order is null)
        {
            throw new NotFoundException("Order was not found.");
        }

        var agentUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.DeliveryAgentId, cancellationToken);

        if (agentUser is null || !agentUser.IsActive)
        {
            throw new ValidationException("مندوب التوصيل المختار غير موجود أو غير نشط حالياً.");
        }

        order.DeliveryAgentId = agentUser.Id;
        order.Status = OrderStatus.AssignedToDelivery;
        order.UpdatedAtUtc = DateTime.UtcNow;

        // Upsert linked DeliveryTask
        var deliveryTask = await _context.DeliveryTasks
            .FirstOrDefaultAsync(d => d.OrderId == order.Id, cancellationToken);

        if (deliveryTask is null)
        {
            deliveryTask = new DeliveryTask
            {
                OrderId = order.Id,
                CourierId = agentUser.Id,
                PickupAddress = "مخزن الوكالة الرئيسي / عنوان البائع",
                DeliveryAddress = order.ShippingAddress,
                Status = DeliveryStatus.Assigned,
                AssignedAtUtc = DateTime.UtcNow,
                CreatedAtUtc = DateTime.UtcNow
            };
            _context.DeliveryTasks.Add(deliveryTask);
        }
        else
        {
            deliveryTask.CourierId = agentUser.Id;
            deliveryTask.Status = DeliveryStatus.Assigned;
            deliveryTask.AssignedAtUtc = DateTime.UtcNow;
            deliveryTask.UpdatedAtUtc = DateTime.UtcNow;
        }

        // Add tracking event
        _context.DeliveryTrackingEvents.Add(new DeliveryTrackingEvent
        {
            DeliveryTaskId = deliveryTask.Id,
            Status = DeliveryStatus.Assigned,
            Note = string.IsNullOrWhiteSpace(request.Notes) ? "تم تعيين مندوب التوصيل بواسطة الإدارة." : request.Notes,
            TimestampUtc = DateTime.UtcNow
        });

        // Notify Buyer
        _context.Notifications.Add(new Notification
        {
            UserId = order.BuyerId,
            Title = "تم تعيين مندوب التوصيل لطلبك 🚚",
            Message = $"تم تعيين مندوب التوصيل لطلبك رقم {order.OrderNumber}. جارٍ تجهيز شحنتك للتسليم.",
            Type = NotificationType.InApp,
            Status = NotificationStatus.Unread,
            CreatedAtUtc = DateTime.UtcNow
        });

        // Notify Delivery Agent
        _context.Notifications.Add(new Notification
        {
            UserId = agentUser.Id,
            Title = "مهمة توصيل جديدة 📦",
            Message = $"تم إسناد طلب جديد رقم {order.OrderNumber} إليك لتوصيله إلى: {order.ShippingAddress}.",
            Type = NotificationType.InApp,
            Status = NotificationStatus.Unread,
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(cancellationToken);

        return OrderDto.From(order);
    }
}
