using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TheAgency.Application.Admin.Commands.ApproveProduct;
using TheAgency.Application.Admin.Commands.DeleteProduct;
using TheAgency.Application.Admin.Commands.RejectProduct;
using TheAgency.Application.Admin.Common;
using TheAgency.Application.Admin.Queries.GetPendingProducts;
using TheAgency.Application.Admin.Queries.GetProductReviewDetails;

namespace TheAgency.API.Controllers.Admin;

public record RejectProductRequest(string Reason);

[ApiController]
[Route("api/admin/products")]
[Authorize(Policy = "AdminOnly")]
public class AdminMarketplaceController : ControllerBase
{
    private readonly ISender _sender;

    public AdminMarketplaceController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet("pending")]
    [ProducesResponseType(typeof(IReadOnlyList<AdminProductReviewDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPendingProducts(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetPendingProductsForAdminQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{productId:guid}/review")]
    [ProducesResponseType(typeof(AdminProductReviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProductReviewDetails(Guid productId, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetProductReviewDetailsQuery(productId), cancellationToken);
        return Ok(result);
    }

    [HttpPost("{productId:guid}/approve")]
    [ProducesResponseType(typeof(AdminProductReviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveProduct(Guid productId, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new ApproveProductCommand(productId), cancellationToken);
        return Ok(result);
    }

    [HttpPost("{productId:guid}/reject")]
    [ProducesResponseType(typeof(AdminProductReviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectProduct(Guid productId, [FromBody] RejectProductRequest request, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new RejectProductCommand(productId, request.Reason), cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{productId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProduct(Guid productId, CancellationToken cancellationToken)
    {
        await _sender.Send(new AdminDeleteProductCommand(productId), cancellationToken);
        return Ok(new { success = true });
    }
}
