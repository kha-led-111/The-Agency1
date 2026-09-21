using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Orders.Common;
using TheAgency.Domain.Enums;
using TheAgency.Domain.Services;
using TheAgency.Application.Payments.Interfaces;

namespace TheAgency.Application.Orders.Commands.UpdateOrderStatus;

public sealed class UpdateOrderStatusCommandHandler : IRequestHandler<UpdateOrderStatusCommand, OrderDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IPaymentProvider _paymentProvider;

    public UpdateOrderStatusCommandHandler(IApplicationDbContext context, IPaymentProvider paymentProvider)
    {
        _context = context;
        _paymentProvider = paymentProvider;
    }

    public async Task<OrderDto> Handle(UpdateOrderStatusCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order is null)
        {
            throw new NotFoundException("Order was not found.");
        }

        var isBuyer = order.BuyerId == request.RequestUserId;
        var isSeller = order.OrderItems.Any(i => i.Product != null && i.Product.SellerId == request.RequestUserId);

        var userRole = request.UserRole;
        var dbUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == request.RequestUserId, cancellationToken);
        if (dbUser is not null && dbUser.Role != userRole)
        {
            userRole = dbUser.Role;
        }

        OrderStateMachine.ValidateTransition(order.Status, request.NewStatus, userRole, isBuyer, isSeller);

        if (userRole == UserRole.Courier && !order.DeliveryAgentId.HasValue)
        {
            order.DeliveryAgentId = request.RequestUserId;
        }

        order.Status = request.NewStatus;
        order.UpdatedAtUtc = DateTime.UtcNow;

        // Synchronize linked DeliveryTask if available
        var deliveryTask = await _context.DeliveryTasks.FirstOrDefaultAsync(d => d.OrderId == order.Id, cancellationToken);
        if (deliveryTask is not null)
        {
            if (!deliveryTask.CourierId.HasValue && request.UserRole == UserRole.Courier)
            {
                deliveryTask.CourierId = request.RequestUserId;
            }

            if (request.NewStatus == OrderStatus.Delivered)
            {
                deliveryTask.Status = DeliveryStatus.Delivered;
                deliveryTask.DeliveredAtUtc = DateTime.UtcNow;
            }
            else if (request.NewStatus == OrderStatus.Returned)
            {
                deliveryTask.Status = DeliveryStatus.Failed;
                deliveryTask.FailureReason = "تم إرجاع الشحنة إلى البائع (مرتجع).";
            }
            deliveryTask.UpdatedAtUtc = DateTime.UtcNow;

            _context.DeliveryTrackingEvents.Add(new TheAgency.Domain.Entities.DeliveryTrackingEvent
            {
                DeliveryTaskId = deliveryTask.Id,
                Status = request.NewStatus == OrderStatus.Delivered ? DeliveryStatus.Delivered : DeliveryStatus.Failed,
                Note = request.NewStatus == OrderStatus.Delivered
                    ? "تم تسليم الشحنة وتحصيل المبلغ بنجاح بواسطة المندوب."
                    : "تم تسجيل إرجاع الشحنة وتطبيق رسوم الإرجاع (20 ج.م).",
                TimestampUtc = DateTime.UtcNow
            });
        }

        foreach (var item in order.OrderItems)
        {
            if (item.Product is not null)
            {
                if (request.NewStatus is OrderStatus.Cancelled or OrderStatus.Returned)
                {
                    item.Product.Status = item.Product.IsApproved ? ProductStatus.Published : ProductStatus.Pending;
                    item.Product.BuyerId = null;
                }
                else if (request.NewStatus is OrderStatus.Delivered)
                {
                    item.Product.Status = ProductStatus.Sold;
                }

                item.Product.UpdatedAtUtc = DateTime.UtcNow;
            }
        }

        if (request.NewStatus == OrderStatus.Returned)
        {
            order.ReturnFee = 20.00m;
            var sellerId = order.OrderItems.FirstOrDefault()?.Product?.SellerId ?? order.BuyerId;
            var courierId = order.DeliveryAgentId ?? (request.UserRole == UserRole.Courier ? request.RequestUserId : (Guid?)null);

            await _paymentProvider.ProcessFullReturnSettlementAsync(
                order,
                order.BuyerId,
                sellerId,
                courierId,
                20.00m,
                cancellationToken);

            var adminUsers = await _context.Users.Where(u => u.Role == UserRole.Admin).ToListAsync(cancellationToken);
            foreach (var admin in adminUsers)
            {
                _context.Notifications.Add(new TheAgency.Domain.Entities.Notification
                {
                    UserId = admin.Id,
                    Title = $"مرتجع جديد: الطلب #{order.OrderNumber}",
                    Message = $"تم إرجاع الطلب #{order.OrderNumber} بواسطة المندوب/المسؤول. تم خصم 20 ج.م رسوم إرجاع وشحن من المشتري والبائع وإضافتها لرصيد المندوب.",
                    Type = NotificationType.InApp,
                    Status = NotificationStatus.Unread,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
        }
        else if (request.NewStatus == OrderStatus.Delivered)
        {
            var courierId = order.DeliveryAgentId ?? (request.UserRole == UserRole.Courier ? request.RequestUserId : (Guid?)null);
            if (courierId.HasValue && courierId.Value != Guid.Empty)
            {
                await _paymentProvider.ProcessOfflineCollectionAsync(order, courierId.Value, cancellationToken);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return OrderDto.From(order);
    }
}
