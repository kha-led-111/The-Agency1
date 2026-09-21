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
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Orders.Commands.CancelOrder;

public sealed class CancelOrderCommandHandler : IRequestHandler<CancelOrderCommand, OrderDto>
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationService? _notificationService;

    public CancelOrderCommandHandler(IApplicationDbContext context, INotificationService? notificationService = null)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<OrderDto> Handle(CancelOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order is null)
        {
            throw new NotFoundException("Order was not found.");
        }

        var requestingUser = await _context.Users.FindAsync(new object[] { request.RequestUserId }, cancellationToken);
        var isAdmin = requestingUser?.Role == UserRole.Admin;
        var isBuyer = order.BuyerId == request.RequestUserId;
        var isSeller = order.OrderItems.Any(i => i.Product != null && i.Product.SellerId == request.RequestUserId);

        if (!isBuyer && !isSeller && !isAdmin)
        {
            throw new UnauthorizedException("You do not have permission to cancel this order.");
        }

        if (order.Status is OrderStatus.OutForDelivery)
        {
            throw new ValidationException("الطلب قيد التوصيل الآن، للإلغاء يرجى التواصل مع الدعم.");
        }

        if (order.Status is OrderStatus.Delivered or OrderStatus.Cancelled or OrderStatus.Returned or OrderStatus.ReturnRequested or OrderStatus.FailedDelivery)
        {
            throw new ValidationException($"Orders in '{order.Status}' status cannot be cancelled.");
        }

        order.Status = OrderStatus.Cancelled;
        order.UpdatedAtUtc = DateTime.UtcNow;

        foreach (var item in order.OrderItems)
        {
            if (item.Product is not null)
            {
                item.Product.Status = item.Product.IsApproved ? ProductStatus.Published : ProductStatus.Pending;
                item.Product.BuyerId = null;
                item.Product.UpdatedAtUtc = DateTime.UtcNow;

                if (_notificationService != null && item.Product.SellerId != Guid.Empty && item.Product.SellerId != request.RequestUserId)
                {
                    await _notificationService.CreateNotificationAsync(
                        item.Product.SellerId,
                        "تم إلغاء الطلب",
                        $"تم إلغاء الطلب رقم {order.OrderNumber} للسلعة '{item.Product.Title}'. وأعيدت السلعة إلى قائمة المعروضات.",
                        NotificationType.InApp,
                        cancellationToken);
                }
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return OrderDto.From(order);
    }
}
