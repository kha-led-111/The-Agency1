using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Orders.Common;
using TheAgency.Application.Orders.Services;
using TheAgency.Application.Payments.Interfaces;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Orders.Commands.ProcessReturnOrder;

public sealed class ProcessReturnOrderCommandHandler : IRequestHandler<ProcessReturnOrderCommand, OrderDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IPaymentProvider _paymentProvider;

    public ProcessReturnOrderCommandHandler(IApplicationDbContext context, IPaymentProvider paymentProvider)
    {
        _context = context;
        _paymentProvider = paymentProvider;
    }

    public async Task<OrderDto> Handle(ProcessReturnOrderCommand request, CancellationToken cancellationToken)
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

        if (!isBuyer && !isSeller)
        {
            throw new UnauthorizedException("You do not have permission to request a return for this order.");
        }

        order.ReturnFee = 20.00m;
        order.Status = OrderStatus.Returned;
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

        var sellerId = order.OrderItems.FirstOrDefault()?.Product?.SellerId ?? order.BuyerId;
        await _paymentProvider.ProcessFullReturnSettlementAsync(order, order.BuyerId, sellerId, order.DeliveryAgentId, 20.00m, cancellationToken);

        var adminUsers = await _context.Users.Where(u => u.Role == UserRole.Admin).ToListAsync(cancellationToken);
        foreach (var admin in adminUsers)
        {
            _context.Notifications.Add(new TheAgency.Domain.Entities.Notification
            {
                UserId = admin.Id,
                Title = $"مرتجع جديد: الطلب #{order.OrderNumber}",
                Message = $"تم إرجاع الطلب #{order.OrderNumber}. تم خصم 20 ج.م رسوم إرجاع وشحن من المشتري والبائع وإضافتها لرصيد المندوب.",
                Type = NotificationType.InApp,
                Status = NotificationStatus.Unread,
                CreatedAtUtc = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync(cancellationToken);
        return OrderDto.From(order);
    }
}
