using System;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Orders.Common;
using TheAgency.Application.Payments.Interfaces;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Orders.Commands.SettleCODPayment;

public sealed class SettleCODPaymentCommandHandler : IRequestHandler<SettleCODPaymentCommand, OrderDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IPaymentProvider _paymentProvider;

    public SettleCODPaymentCommandHandler(IApplicationDbContext context, IPaymentProvider paymentProvider)
    {
        _context = context;
        _paymentProvider = paymentProvider;
    }

    public async Task<OrderDto> Handle(SettleCODPaymentCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order is null)
        {
            throw new NotFoundException("Order was not found.");
        }

        if (order.Status == OrderStatus.Cancelled)
        {
            throw new ValidationException("Cancelled orders cannot be settled for payment.");
        }

        order.Status = OrderStatus.Paid;
        order.UpdatedAtUtc = DateTime.UtcNow;

        foreach (var item in order.OrderItems)
        {
            if (item.Product is not null)
            {
                item.Product.Status = ProductStatus.Sold;
                item.Product.UpdatedAtUtc = DateTime.UtcNow;
            }
        }

        await _paymentProvider.ProcessOfflineCollectionAsync(order, request.RequestUserId, cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);
        return OrderDto.From(order);
    }
}
