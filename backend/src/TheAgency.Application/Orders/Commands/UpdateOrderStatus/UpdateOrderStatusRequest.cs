using TheAgency.Domain.Enums;

namespace TheAgency.Application.Orders.Commands.UpdateOrderStatus;

public sealed record UpdateOrderStatusRequest(
    OrderStatus Status
);
