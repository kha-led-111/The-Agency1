using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TheAgency.Application.Payments.Common;
using TheAgency.Application.Payments.Queries.GetMyLedger;
using TheAgency.Application.Payments.Queries.GetMyTransactions;

namespace TheAgency.API.Controllers.Payments;

[ApiController]
[Route("api/payments")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly ISender _sender;

    public PaymentsController(ISender sender)
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

    [HttpGet("transactions")]
    [ProducesResponseType(typeof(IReadOnlyList<PaymentTransactionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyTransactions(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var transactions = await _sender.Send(new GetMyTransactionsQuery(userId), cancellationToken);
        return Ok(transactions);
    }

    [HttpGet("my-ledger")]
    [ProducesResponseType(typeof(UserLedgerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyLedger(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var ledger = await _sender.Send(new GetMyLedgerQuery(userId), cancellationToken);
        return Ok(ledger);
    }
}
