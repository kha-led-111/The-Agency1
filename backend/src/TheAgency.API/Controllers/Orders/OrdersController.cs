using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TheAgency.Application.Orders.Commands.CancelOrder;
using TheAgency.Application.Orders.Commands.CreateOrder;
using TheAgency.Application.Orders.Commands.ProcessReturnOrder;
using TheAgency.Application.Orders.Commands.SettleCODPayment;
using TheAgency.Application.Orders.Commands.UpdateOrderStatus;
using TheAgency.Application.Orders.Common;
using TheAgency.Application.Orders.Queries.GetMyOrders;
using TheAgency.Application.Orders.Queries.GetOrderById;
using TheAgency.Domain.Enums;

namespace TheAgency.API.Controllers.Orders;

[ApiController]
[Route("api/orders")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly ISender _sender;

    public OrdersController(ISender sender)
    {
        _sender = sender;
    }

    private Guid GetCurrentUserId()
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(idStr, out var userId))
        {
            throw new UnauthorizedAccessException("User is not authenticated.");
        }
        return userId;
    }

    [HttpPost]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateOrder(
        [FromBody] CreateOrderRequest request,
        [FromHeader(Name = "Idempotency-Key")] string? idempotencyHeader,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var idempotencyKey = !string.IsNullOrWhiteSpace(idempotencyHeader)
            ? idempotencyHeader
            : request.IdempotencyKey;

        var command = new CreateOrderCommand(userId, request.ProductIds, request.ShippingAddress, idempotencyKey);
        var order = await _sender.Send(command, cancellationToken);
        return Ok(order);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetOrderById(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var order = await _sender.Send(new GetOrderByIdQuery(id, userId), cancellationToken);
        return Ok(order);
    }

    [HttpGet("buyer")]
    [ProducesResponseType(typeof(IReadOnlyList<OrderDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBuyerOrders(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var orders = await _sender.Send(new GetMyOrdersQuery(userId, OrderRoleFilter.Buyer), cancellationToken);
        return Ok(orders);
    }

    [HttpGet("seller")]
    [ProducesResponseType(typeof(IReadOnlyList<OrderDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSellerOrders(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var orders = await _sender.Send(new GetMyOrdersQuery(userId, OrderRoleFilter.Seller), cancellationToken);
        return Ok(orders);
    }

    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelOrder(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var order = await _sender.Send(new CancelOrderCommand(id, userId), cancellationToken);
        return Ok(order);
    }

    [HttpPost("{id:guid}/settle-cod")]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SettleCODPayment(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var order = await _sender.Send(new SettleCODPaymentCommand(id, userId), cancellationToken);
        return Ok(order);
    }

    [HttpPost("{id:guid}/return")]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ProcessReturn(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var order = await _sender.Send(new ProcessReturnOrderCommand(id, userId), cancellationToken);
        return Ok(order);
    }

    private UserRole GetCurrentUserRole()
    {
        var roleStr = User.FindFirstValue(ClaimTypes.Role);
        if (Enum.TryParse<UserRole>(roleStr, ignoreCase: true, out var role))
        {
            return role;
        }
        return UserRole.Buyer;
    }

    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateOrderStatus(
        Guid id,
        [FromBody] UpdateOrderStatusRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var userRole = GetCurrentUserRole();
        var command = new UpdateOrderStatusCommand(id, userId, userRole, request.Status);
        var order = await _sender.Send(command, cancellationToken);
        return Ok(order);
    }
}
