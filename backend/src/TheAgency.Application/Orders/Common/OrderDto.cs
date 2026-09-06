using System;
using System.Collections.Generic;
using System.Linq;
using TheAgency.Domain.Entities;

namespace TheAgency.Application.Orders.Common;

public sealed record OrderDto(
    Guid Id,
    string OrderNumber,
    Guid BuyerId,
    decimal ItemPrice,
    decimal DeliveryFee,
    decimal BuyerFee,
    decimal SellerCommission,
    decimal CourierEarnings,
    decimal PlatformEarnings,
    decimal TotalAmount,
    decimal ReturnFee,
    decimal ReturnPercentageFee,
    string ShippingAddress,
    string Status,
    string PaymentMethod,
    string? IdempotencyKey,
    DateTime CreatedAtUtc,
    IReadOnlyList<OrderItemDto> Items
)
{
    public static OrderDto From(Order order)
    {
        return new OrderDto(
            order.Id,
            order.OrderNumber,
            order.BuyerId,
            order.ItemPrice,
            order.DeliveryFee,
            order.BuyerFee,
            order.SellerCommission,
            order.CourierEarnings,
            order.PlatformEarnings,
            order.TotalAmount,
            order.ReturnFee,
            order.ReturnPercentageFee,
            order.ShippingAddress,
            order.Status.ToString(),
            order.PaymentMethod.ToString(),
            order.IdempotencyKey,
            order.CreatedAtUtc,
            order.OrderItems?.Select(OrderItemDto.From).ToList() ?? new List<OrderItemDto>()
        );
    }
}
