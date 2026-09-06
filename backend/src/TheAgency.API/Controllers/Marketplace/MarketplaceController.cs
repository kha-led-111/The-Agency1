using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TheAgency.Application.Common.Models;
using TheAgency.Application.Marketplace.Commands.CreateProduct;
using TheAgency.Application.Marketplace.Commands.DeleteProduct;
using TheAgency.Application.Marketplace.Commands.Favorites;
using TheAgency.Application.Marketplace.Commands.UpdateProduct;
using TheAgency.Application.Marketplace.Commands.UploadProductImage;
using TheAgency.Application.Marketplace.Common;
using TheAgency.Application.Marketplace.Queries.Favorites;
using TheAgency.Application.Marketplace.Queries.GetCategories;
using TheAgency.Application.Marketplace.Queries.GetProductBySlug;
using TheAgency.Application.Marketplace.Queries.GetProducts;
using TheAgency.Domain.Enums;

namespace TheAgency.API.Controllers.Marketplace;

[ApiController]
[Route("api/marketplace")]
public class MarketplaceController : ControllerBase
{
    private readonly ISender _sender;

    public MarketplaceController(ISender sender)
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

    [HttpGet("categories")]
    [ProducesResponseType(typeof(IReadOnlyList<CategoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCategories(CancellationToken cancellationToken)
    {
        var categories = await _sender.Send(new GetCategoriesQuery(), cancellationToken);
        return Ok(categories);
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<ProductDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProducts(
        [FromQuery] string? search,
        [FromQuery] Guid? categoryId,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] ProductCondition? condition,
        [FromQuery] string? sortBy,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 12,
        CancellationToken cancellationToken = default)
    {
        var query = new GetProductsQuery(search, categoryId, minPrice, maxPrice, condition, sortBy, pageNumber, pageSize);
        var products = await _sender.Send(query, cancellationToken);
        return Ok(products);
    }

    [HttpGet("{slug}")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProductBySlug(string slug, CancellationToken cancellationToken)
    {
        var product = await _sender.Send(new GetProductBySlugQuery(slug), cancellationToken);
        return Ok(product);
    }

    [Authorize]
    [HttpPost]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest request, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new CreateProductCommand(
            userId,
            request.Title,
            request.Description,
            request.Price,
            request.Condition,
            request.CategoryId,
            request.ImageUrl);

        var product = await _sender.Send(command, cancellationToken);
        return Ok(product);
    }

    [Authorize]
    [HttpPut("{productId:guid}")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProduct(Guid productId, [FromBody] UpdateProductRequest request, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var command = new UpdateProductCommand(
            productId,
            userId,
            request.Title,
            request.Description,
            request.Price,
            request.Condition,
            request.Status,
            request.ImageUrl);

        var updated = await _sender.Send(command, cancellationToken);
        return Ok(updated);
    }

    [Authorize]
    [HttpDelete("{productId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProduct(Guid productId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        await _sender.Send(new DeleteProductCommand(productId, userId), cancellationToken);
        return Ok(new { success = true });
    }

    [Authorize]
    [HttpPost("upload-image")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadImage(IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { error = "No file was uploaded." });
        }

        using var stream = file.OpenReadStream();
        var command = new UploadProductImageCommand(stream, file.FileName, file.ContentType, file.Length);
        var imageUrl = await _sender.Send(command, cancellationToken);
        return Ok(new { imageUrl });
    }

    [Authorize]
    [HttpPost("{productId:guid}/favorite")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> AddFavorite(Guid productId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        await _sender.Send(new AddFavoriteCommand(userId, productId), cancellationToken);
        return Ok(new { success = true });
    }

    [Authorize]
    [HttpDelete("{productId:guid}/favorite")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RemoveFavorite(Guid productId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        await _sender.Send(new RemoveFavoriteCommand(userId, productId), cancellationToken);
        return Ok(new { success = true });
    }

    [Authorize]
    [HttpGet("favorites")]
    [ProducesResponseType(typeof(IReadOnlyList<ProductDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetFavorites(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var favorites = await _sender.Send(new GetMyFavoritesQuery(userId), cancellationToken);
        return Ok(favorites);
    }
}
