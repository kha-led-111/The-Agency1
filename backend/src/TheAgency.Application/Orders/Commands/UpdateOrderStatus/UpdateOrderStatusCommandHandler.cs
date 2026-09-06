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

namespace TheAgency.Application.Orders.Commands.UpdateOrderStatus;

public sealed class UpdateOrderStatusCommandHandler : IRequestHandler<UpdateOrderStatusCommand, OrderDto>
{
    private readonly IApplicationDbContext _context;

    public UpdateOrderStatusCommandHandler(IApplicationDbContext context)
    {
        _context = context;
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

        OrderStateMachine.ValidateTransition(order.Status, request.NewStatus, request.UserRole, isBuyer, isSeller);

        order.Status = request.NewStatus;
        order.UpdatedAtUtc = DateTime.UtcNow;

        foreach (var item in order.OrderItems)
        {
            if (item.Product is not null)
            {
                if (request.NewStatus is OrderStatus.Cancelled or OrderStatus.Returned)
                {
                    item.Product.Status = ProductStatus.Published;
                    item.Product.BuyerId = null;
                }
                else if (request.NewStatus is OrderStatus.Delivered)
                {
                    item.Product.Status = ProductStatus.Sold;
                }

                item.Product.UpdatedAtUtc = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return OrderDto.From(order);
    }
}
