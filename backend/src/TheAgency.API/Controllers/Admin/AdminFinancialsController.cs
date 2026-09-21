using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TheAgency.Application.Admin.Common;
using TheAgency.Application.Admin.Queries.GetFinancialSummary;

namespace TheAgency.API.Controllers.Admin;

[ApiController]
[Route("api/admin/financials")]
[Authorize(Policy = "AdminOnly")]
public class AdminFinancialsController : ControllerBase
{
    private readonly ISender _sender;

    public AdminFinancialsController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(AdminFinancialSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFinancialSummary(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetAdminFinancialSummaryQuery(), cancellationToken);
        return Ok(result);
    }
}
