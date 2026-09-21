using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Notifications.Interfaces;
using TheAgency.Application.Orders.Common;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Orders.Commands.ConfirmSellerAvailability;

public sealed class ConfirmSellerAvailabilityCommandHandler : IRequestHandler<ConfirmSellerAvailabilityCommand, OrderDto>
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationService? _notificationService;

    public ConfirmSellerAvailabilityCommandHandler(IApplicationDbContext context, INotificationService? notificationService = null)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<OrderDto> Handle(ConfirmSellerAvailabilityCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order is null)
        {
            throw new NotFoundException("Order was not found.");
        }

        var seller = await _context.Users.FindAsync(new object[] { request.SellerId }, cancellationToken);
        var isAdmin = seller?.Role == UserRole.Admin;
        var isSeller = order.OrderItems.Any(i => i.Product != null && i.Product.SellerId == request.SellerId);

        if (!isSeller && !isAdmin)
        {
            throw new UnauthorizedException("You are not authorized to confirm or reject availability for this order.");
        }

        if (order.Status != OrderStatus.PendingSellerConfirmation)
        {
            throw new ValidationException($"Order availability can only be confirmed when status is PendingSellerConfirmation. Current status is '{order.Status}'.");
        }

        if (request.IsAvailable)
        {
            order.Status = OrderStatus.Processing;
            order.UpdatedAtUtc = DateTime.UtcNow;

            if (_notificationService != null && order.BuyerId != Guid.Empty)
            {
                await _notificationService.CreateNotificationAsync(
                    order.BuyerId,
                    "تم تأكيد توفر طلبك",
                    $"تم تأكيد توفر طلبك رقم {order.OrderNumber} وجاري تجهيزه للشحن.",
                    NotificationType.InApp,
                    cancellationToken);
            }
            else
            {
                _context.Notifications.Add(new Notification
                {
                    UserId = order.BuyerId,
                    Title = "تم تأكيد توفر طلبك",
                    Message = $"تم تأكيد توفر طلبك رقم {order.OrderNumber} وجاري تجهيزه للشحن.",
                    Type = NotificationType.InApp,
                    Status = NotificationStatus.Unread,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
        }
        else
        {
            order.Status = OrderStatus.Cancelled;
            order.UpdatedAtUtc = DateTime.UtcNow;

            foreach (var item in order.OrderItems)
            {
                if (item.Product is not null)
                {
                    item.Product.Status = item.Product.IsApproved ? ProductStatus.Published : ProductStatus.Pending;
                    item.Product.BuyerId = null;
                    item.Product.UpdatedAtUtc = DateTime.UtcNow;
                }
            }

            var sellerEntity = await _context.Users.FindAsync(new object[] { request.SellerId }, cancellationToken);
            if (sellerEntity != null)
            {
                sellerEntity.PenaltyPoints += 1;
                sellerEntity.UpdatedAtUtc = DateTime.UtcNow;
            }

            if (_notificationService != null && order.BuyerId != Guid.Empty)
            {
                await _notificationService.CreateNotificationAsync(
                    order.BuyerId,
                    "إلغاء الطلب لعدم توفر المنتج",
                    $"نعتذر منك، الطلب رقم {order.OrderNumber} تم إلغاؤه نظراً لعدم توفر القطعة لدى البائع حالياً.",
                    NotificationType.InApp,
                    cancellationToken);

                await _notificationService.CreateNotificationAsync(
                    request.SellerId,
                    "تسجيل نقطة تحذير على حسابك",
                    $"تم تسجيل نقطة تحذير على حسابك بسبب إلغاء الطلب رقم {order.OrderNumber} لعدم توفر المنتج.",
                    NotificationType.InApp,
                    cancellationToken);
            }
            else
            {
                _context.Notifications.Add(new Notification
                {
                    UserId = order.BuyerId,
                    Title = "إلغاء الطلب لعدم توفر المنتج",
                    Message = $"نعتذر منك، الطلب رقم {order.OrderNumber} تم إلغاؤه نظراً لعدم توفر القطعة لدى البائع حالياً.",
                    Type = NotificationType.InApp,
                    Status = NotificationStatus.Unread,
                    CreatedAtUtc = DateTime.UtcNow
                });

                _context.Notifications.Add(new Notification
                {
                    UserId = request.SellerId,
                    Title = "تسجيل نقطة تحذير على حسابك",
                    Message = $"تم تسجيل نقطة تحذير على حسابك بسبب إلغاء الطلب رقم {order.OrderNumber} لعدم توفر المنتج.",
                    Type = NotificationType.InApp,
                    Status = NotificationStatus.Unread,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return OrderDto.From(order);
    }
}
