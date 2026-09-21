using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TheAgency.Application.Admin.Common;
using TheAgency.Application.Admin.Queries.GetDashboardStats;

namespace TheAgency.API.Controllers.Admin;

[ApiController]
[Route("api/admin/dashboard")]
[Authorize(Policy = "AdminOnly")]
public class AdminDashboardController : ControllerBase
{
    private readonly ISender _sender;

    public AdminDashboardController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet("stats")]
    [ProducesResponseType(typeof(AdminDashboardStatsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboardStats(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetAdminDashboardStatsQuery(), cancellationToken);
        return Ok(result);
    }
}
