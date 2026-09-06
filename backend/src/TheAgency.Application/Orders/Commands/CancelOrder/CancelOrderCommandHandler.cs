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
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Orders.Commands.CancelOrder;

public sealed class CancelOrderCommandHandler : IRequestHandler<CancelOrderCommand, OrderDto>
{
    private readonly IApplicationDbContext _context;

    public CancelOrderCommandHandler(IApplicationDbContext context)
    {
        _context = context;
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

        var isBuyer = order.BuyerId == request.RequestUserId;
        var isSeller = order.OrderItems.Any(i => i.Product != null && i.Product.SellerId == request.RequestUserId);

        if (!isBuyer && !isSeller)
        {
            throw new UnauthorizedException("You do not have permission to cancel this order.");
        }

        if (order.Status is OrderStatus.Delivered or OrderStatus.OutForDelivery or OrderStatus.Cancelled)
        {
            throw new ValidationException($"Orders in '{order.Status}' status cannot be cancelled.");
        }

        order.Status = OrderStatus.Cancelled;
        order.UpdatedAtUtc = DateTime.UtcNow;

        foreach (var item in order.OrderItems)
        {
            if (item.Product is not null)
            {
                item.Product.Status = ProductStatus.Published;
                item.Product.BuyerId = null;
                item.Product.UpdatedAtUtc = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return OrderDto.From(order);
    }
}
