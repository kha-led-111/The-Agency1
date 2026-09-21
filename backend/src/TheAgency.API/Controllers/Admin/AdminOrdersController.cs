using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Identity.Common;
using TheAgency.Application.Orders.Commands.AssignDeliveryAgent;
using TheAgency.Application.Orders.Common;
using TheAgency.Domain.Enums;

using TheAgency.Application.Orders.Queries.GetPendingAdminOrders;

namespace TheAgency.API.Controllers.Admin;

public record AssignDeliveryRequest(Guid DeliveryAgentId, string? Notes);

[ApiController]
[Route("api/admin/orders")]
[Authorize(Roles = "Admin")]
public class AdminOrdersController : ControllerBase
{
    private readonly ISender _sender;
    private readonly IApplicationDbContext _context;

    public AdminOrdersController(ISender sender, IApplicationDbContext context)
    {
        _sender = sender;
        _context = context;
    }

    [HttpGet("pending-assignment")]
    [ProducesResponseType(typeof(IReadOnlyList<OrderDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPendingAssignmentOrders(CancellationToken cancellationToken)
    {
        var orders = await _sender.Send(new GetPendingAdminOrdersQuery(), cancellationToken);
        return Ok(orders);
    }

    [HttpPost("{id:guid}/assign-delivery")]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignDelivery(Guid id, [FromBody] AssignDeliveryRequest request, CancellationToken cancellationToken)
    {
        var command = new AssignDeliveryAgentCommand(id, request.DeliveryAgentId, request.Notes);
        var result = await _sender.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpGet("couriers")]
    [ProducesResponseType(typeof(IReadOnlyList<UserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailableCouriers(CancellationToken cancellationToken)
    {
        var couriers = await _context.Users
            .AsNoTracking()
            .Where(u => u.IsActive && (u.Role == UserRole.Courier || u.Role == UserRole.Admin))
            .OrderBy(u => u.FirstName)
            .ThenBy(u => u.LastName)
            .ToListAsync(cancellationToken);

        var dtos = couriers.Select(UserDto.From).ToList();
        return Ok(dtos);
    }
}
