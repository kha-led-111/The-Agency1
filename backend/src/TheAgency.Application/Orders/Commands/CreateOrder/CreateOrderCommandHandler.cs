using System;
using System.Collections.Generic;
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
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Orders.Commands.CreateOrder;

public sealed class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, OrderDto>
{
    private static readonly SemaphoreSlim CheckoutLock = new(1, 1);
    private readonly IApplicationDbContext _context;

    public CreateOrderCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OrderDto> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        // 1. Idempotency Check (Rule 9)
        if (!string.IsNullOrWhiteSpace(request.IdempotencyKey))
        {
            var existingOrder = await _context.Orders
                .AsNoTracking()
                .Include(o => o.OrderItems)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(o => o.BuyerId == request.BuyerId && o.IdempotencyKey == request.IdempotencyKey, cancellationToken);

            if (existingOrder is not null)
            {
                return OrderDto.From(existingOrder);
            }
        }

        var productIds = request.ProductIds.Distinct().ToList();

        // 2. Rule 9 Concurrency Protection — Thread-safe atomic reservation
        await CheckoutLock.WaitAsync(cancellationToken);
        try
        {
            var products = await _context.Products
                .Where(p => productIds.Contains(p.Id))
                .ToListAsync(cancellationToken);

            if (products.Count != productIds.Count)
            {
                throw new NotFoundException("One or more selected products were not found.");
            }

            // Check if any product is already reserved/sold
            var unavailableProducts = products.Where(p => p.Status != ProductStatus.Published || !p.IsApproved).ToList();
            if (unavailableProducts.Count > 0)
            {
                throw new ConflictException("One or more selected products have already been reserved or sold by another buyer.");
            }

            // Prevent self-purchase
            var selfPurchased = products.Where(p => p.SellerId == request.BuyerId).ToList();
            if (selfPurchased.Count > 0)
            {
                throw new ValidationException("Sellers cannot purchase their own product listings.");
            }

            // 3. Multi-Party Commission Financial Calculation (Rule 8 & ADR-003)
            decimal itemPriceSum = products.Sum(p => p.Price);
            var financials = CommissionFeeCalculator.CalculateOrderFinancials(itemPriceSum);

            var orderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid():N}"[..22].ToUpperInvariant();

            var order = new Order
            {
                OrderNumber = orderNumber,
                BuyerId = request.BuyerId,
                ItemPrice = financials.ItemPrice,
                DeliveryFee = financials.DeliveryFee,
                BuyerFee = financials.BuyerFee,
                SellerCommission = financials.SellerCommission,
                CourierEarnings = financials.CourierEarnings,
                PlatformEarnings = financials.PlatformEarnings,
                TotalAmount = financials.TotalAmountPayableByBuyer,
                ShippingAddress = request.ShippingAddress.Trim(),
                Status = OrderStatus.PendingPayment,
                PaymentMethod = PaymentMethod.CashOnDelivery,
                IdempotencyKey = request.IdempotencyKey,
                CreatedAtUtc = DateTime.UtcNow
            };

            foreach (var product in products)
            {
                product.Status = ProductStatus.Reserved;
                product.BuyerId = request.BuyerId;
                product.UpdatedAtUtc = DateTime.UtcNow;

                order.OrderItems.Add(new OrderItem
                {
                    OrderId = order.Id,
                    ProductId = product.Id,
                    UnitPrice = product.Price,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }

            _context.Orders.Add(order);
            await _context.SaveChangesAsync(cancellationToken);

            // Load items with product title for clean DTO
            var createdOrder = await _context.Orders
                .AsNoTracking()
                .Include(o => o.OrderItems)
                    .ThenInclude(i => i.Product)
                .FirstAsync(o => o.Id == order.Id, cancellationToken);

            return OrderDto.From(createdOrder);
        }
        finally
        {
            CheckoutLock.Release();
        }
    }
}
