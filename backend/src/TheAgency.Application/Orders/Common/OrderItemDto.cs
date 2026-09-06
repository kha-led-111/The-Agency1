using System;
using TheAgency.Domain.Entities;

namespace TheAgency.Application.Orders.Common;

public sealed record OrderItemDto(
    Guid Id,
    Guid ProductId,
    string ProductTitle,
    decimal UnitPrice
)
{
    public static OrderItemDto From(OrderItem item)
    {
        return new OrderItemDto(
            item.Id,
            item.ProductId,
            item.Product?.Title ?? string.Empty,
            item.UnitPrice
        );
    }
}
