using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Marketplace.Commands.DeleteProduct;
using TheAgency.Application.Marketplace.Commands.Favorites;
using TheAgency.Application.Marketplace.Commands.UploadProductImage;
using TheAgency.Application.Marketplace.Queries.GetCategories;
using TheAgency.Application.Marketplace.Queries.GetProducts;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;
using TheAgency.Infrastructure.Persistence;
using Xunit;

namespace TheAgency.Tests.Unit.Marketplace;

public class MarketplaceUnitTests
{
    private readonly ApplicationDbContext _context;

    public MarketplaceUnitTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
    }

    [Fact]
    public async Task GetCategories_ShouldReturnActiveCategoriesWithProductCount()
    {
        var category = new Category { Id = Guid.NewGuid(), Name = "Electronics", Slug = "electronics", IsActive = true };
        _context.Categories.Add(category);
        _context.Products.Add(new Product
        {
            Id = Guid.NewGuid(),
            Title = "Laptop",
            Slug = "laptop",
            Price = 999,
            CategoryId = category.Id,
            SellerId = Guid.NewGuid(),
            Status = ProductStatus.Published,
            IsApproved = true
        });
        await _context.SaveChangesAsync();

        var handler = new GetCategoriesQueryHandler(_context);
        var result = await handler.Handle(new GetCategoriesQuery(), CancellationToken.None);

        result.Should().HaveCount(1);
        result[0].Name.Should().Be("Electronics");
        result[0].ProductCount.Should().Be(1);
    }

    [Fact]
    public async Task GetProducts_WithFilters_ShouldReturnFilteredPagedResult()
    {
        var category1 = new Category { Id = Guid.NewGuid(), Name = "Tech", Slug = "tech", IsActive = true };
        var category2 = new Category { Id = Guid.NewGuid(), Name = "Books", Slug = "books", IsActive = true };
        _context.Categories.AddRange(category1, category2);

        _context.Products.AddRange(
            new Product { Id = Guid.NewGuid(), Title = "Gaming Laptop", Slug = "gaming-laptop", Description = "High performance", Price = 1500, CategoryId = category1.Id, SellerId = Guid.NewGuid(), Status = ProductStatus.Published, IsApproved = true, Condition = ProductCondition.LikeNew },
            new Product { Id = Guid.NewGuid(), Title = "Budget Phone", Slug = "budget-phone", Description = "Affordable smartphone", Price = 200, CategoryId = category1.Id, SellerId = Guid.NewGuid(), Status = ProductStatus.Published, IsApproved = true, Condition = ProductCondition.Good },
            new Product { Id = Guid.NewGuid(), Title = "C# Programming Book", Slug = "csharp-book", Description = "Learn C#", Price = 50, CategoryId = category2.Id, SellerId = Guid.NewGuid(), Status = ProductStatus.Published, IsApproved = true, Condition = ProductCondition.New }
        );
        await _context.SaveChangesAsync();

        var handler = new GetProductsQueryHandler(_context);
        var query = new GetProductsQuery(Search: "Phone", CategoryId: category1.Id, MinPrice: 100, MaxPrice: 300);

        var result = await handler.Handle(query, CancellationToken.None);

        result.TotalCount.Should().Be(1);
        result.Items[0].Title.Should().Be("Budget Phone");
        result.Items[0].Price.Should().Be(200);
    }

    [Fact]
    public async Task DeleteProduct_WhenNonSeller_ShouldThrowUnauthorizedException()
    {
        var sellerId = Guid.NewGuid();
        var attackerId = Guid.NewGuid();
        var productId = Guid.NewGuid();

        _context.Products.Add(new Product
        {
            Id = productId,
            Title = "Seller Item",
            SellerId = sellerId,
            Status = ProductStatus.Published
        });
        await _context.SaveChangesAsync();

        var handler = new DeleteProductCommandHandler(_context);
        var command = new DeleteProductCommand(productId, attackerId);

        var act = async () => await handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("*delete your own products*");
    }

    [Fact]
    public async Task DeleteProduct_WhenSeller_ShouldMarkAsRemoved()
    {
        var sellerId = Guid.NewGuid();
        var productId = Guid.NewGuid();

        _context.Products.Add(new Product
        {
            Id = productId,
            Title = "Seller Item",
            SellerId = sellerId,
            Status = ProductStatus.Published
        });
        await _context.SaveChangesAsync();

        var handler = new DeleteProductCommandHandler(_context);
        var command = new DeleteProductCommand(productId, sellerId);

        var result = await handler.Handle(command, CancellationToken.None);

        result.Should().BeTrue();
        var deleted = await _context.Products.FindAsync(productId);
        deleted!.Status.Should().Be(ProductStatus.Removed);
    }

    [Fact]
    public async Task UploadProductImage_WithInvalidHeader_ShouldThrowValidationException()
    {
        var storage = Substitute.For<IImageStorageService>();
        var handler = new UploadProductImageCommandHandler(storage);

        // Fake stream with invalid magic header bytes
        var invalidBytes = Encoding.UTF8.GetBytes("THIS IS NOT A VALID IMAGE HEADER");
        using var stream = new MemoryStream(invalidBytes);

        var command = new UploadProductImageCommand(stream, "test.png", "image/png", invalidBytes.Length);

        var act = async () => await handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*magic header does not match*");
    }

    [Fact]
    public async Task UploadProductImage_WithValidPngHeader_ShouldSaveImage()
    {
        var storage = Substitute.For<IImageStorageService>();
        storage.SaveImageAsync(Arg.Any<Stream>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns("/uploads/safe.png");

        var handler = new UploadProductImageCommandHandler(storage);

        // PNG Magic header: 0x89, 0x50, 0x4E, 0x47
        byte[] pngHeader = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
        using var stream = new MemoryStream(pngHeader);

        var command = new UploadProductImageCommand(stream, "sample.png", "image/png", pngHeader.Length);

        var result = await handler.Handle(command, CancellationToken.None);

        result.Should().Be("/uploads/safe.png");
    }

    [Fact]
    public async Task AddFavorite_ShouldAddFavoriteRecord()
    {
        var userId = Guid.NewGuid();
        var productId = Guid.NewGuid();

        _context.Products.Add(new Product { Id = productId, Title = "Test Product" });
        await _context.SaveChangesAsync();

        var handler = new AddFavoriteCommandHandler(_context);
        var result = await handler.Handle(new AddFavoriteCommand(userId, productId), CancellationToken.None);

        result.Should().BeTrue();
        var favorite = await _context.Favorites.FirstOrDefaultAsync(f => f.UserId == userId && f.ProductId == productId);
        favorite.Should().NotBeNull();
    }
}
