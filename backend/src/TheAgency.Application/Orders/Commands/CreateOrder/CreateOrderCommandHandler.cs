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

        // 2. Request Deduplication Check (Same BuyerId + ProductId in last 10 seconds)
        var deduplicationCutoff = DateTime.UtcNow.AddSeconds(-10);
        var recentDuplicateOrder = await _context.Orders
            .AsNoTracking()
            .Include(o => o.OrderItems)
                .ThenInclude(i => i.Product)
            .Where(o => o.BuyerId == request.BuyerId && o.CreatedAtUtc >= deduplicationCutoff)
            .Where(o => o.OrderItems.Any(i => productIds.Contains(i.ProductId)))
            .FirstOrDefaultAsync(cancellationToken);

        if (recentDuplicateOrder is not null)
        {
            return OrderDto.From(recentDuplicateOrder);
        }

        // 3. Rule 9 Concurrency Protection — Thread-safe atomic reservation
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
                throw new ConflictException("عذراً، هذا المنتج تم حجزه أو شراؤه للتو بواسطة مستخدم آخر.");
            }

            // Prevent self-purchase
            var selfPurchased = products.Where(p => p.SellerId == request.BuyerId).ToList();
            if (selfPurchased.Count > 0)
            {
                throw new ValidationException("لا يمكنك شراء المنتجات التي قمت برفعها بنفسك");
            }

            // Validate mandatory address completeness & Egyptian phone format (11 digits starting with 01)
            var hasValidAddress = !string.IsNullOrWhiteSpace(request.ShippingAddress) && request.ShippingAddress.Trim().Length >= 5;
            if (!hasValidAddress)
            {
                throw new ValidationException("عنوان التوصيل غير مكتمل. يرجى إدخال عنوان تفصيلي مكون من 5 حروف على الأقل.");
            }

            var buyer = await _context.Users.FindAsync(new object[] { request.BuyerId }, cancellationToken);
            if (buyer is not null && !string.IsNullOrWhiteSpace(buyer.PhoneNumber))
            {
                var cleanDigits = System.Text.RegularExpressions.Regex.Replace(buyer.PhoneNumber, @"\D", "");
                var isPhoneValid = System.Text.RegularExpressions.Regex.IsMatch(cleanDigits, @"^01[0125]\d{8}$");
                if (!isPhoneValid)
                {
                    throw new ValidationException("يلزم وجود رقم هاتف مصري صالح (11 رقم يبدأ بـ 01) وعنوان توصيل مكتمل لإتمام الطلب.");
                }
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
                Status = OrderStatus.PendingAdminReview,
                DeliveryAgentId = null,
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

            var sellerIds = products.Select(p => p.SellerId).Distinct();
            foreach (var sellerId in sellerIds)
            {
                _context.Notifications.Add(new Notification
                {
                    UserId = sellerId,
                    Title = "طلب جديد بحاجة لتأكيد التوفر",
                    Message = $"لديك طلب جديد رقم {orderNumber}. يرجى تأكيد توفر القطعة وتجهيزها أو الإلغاء إذا كانت غير متاحة حالياً.",
                    Type = NotificationType.InApp,
                    Status = NotificationStatus.Unread,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }

            _context.Orders.Add(order);
            try
            {
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new ConflictException("عذراً، هذا المنتج تم حجزه أو شراؤه للتو بواسطة مستخدم آخر.");
            }

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
