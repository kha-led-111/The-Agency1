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
using TheAgency.Application.Marketplace.Commands.CreateProduct;
using TheAgency.Application.Marketplace.Commands.DeleteProduct;
using TheAgency.Application.Marketplace.Commands.Favorites;
using TheAgency.Application.Marketplace.Commands.UploadProductImage;
using TheAgency.Application.Marketplace.Queries.Favorites;
using TheAgency.Application.Marketplace.Queries.GetCategories;
using TheAgency.Application.Marketplace.Queries.GetProducts;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;
using TheAgency.Domain.Services;
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
    public async Task GetProducts_WithCombinedFiltersAndPagination_ShouldReturnMatchingPagedResult()
    {
        var category = new Category { Id = Guid.NewGuid(), Name = "Clothing", Slug = "clothing" };
        var subcategory = new Category { Id = Guid.NewGuid(), Name = "Shirts", Slug = "shirts", ParentId = category.Id };
        _context.Categories.AddRange(category, subcategory);

        var p1 = new Product
        {
            Id = Guid.NewGuid(),
            Title = "Silk Shirt Medium",
            Slug = "silk-shirt-m",
            Description = "Elegant shirt",
            Price = 450,
            CategoryId = category.Id,
            SubcategoryId = subcategory.Id,
            Size = "M",
            Condition = ProductCondition.LikeNew,
            Status = ProductStatus.Published,
            IsApproved = true,
            SellerId = Guid.NewGuid()
        };

        var p2 = new Product
        {
            Id = Guid.NewGuid(),
            Title = "Cotton Shirt Large",
            Slug = "cotton-shirt-l",
            Description = "Casual shirt",
            Price = 300,
            CategoryId = category.Id,
            SubcategoryId = subcategory.Id,
            Size = "L",
            Condition = ProductCondition.Good,
            Status = ProductStatus.Published,
            IsApproved = true,
            SellerId = Guid.NewGuid()
        };

        _context.Products.AddRange(p1, p2);
        await _context.SaveChangesAsync();

        var handler = new GetProductsQueryHandler(_context);
        var query = new GetProductsQuery(
            SubcategoryId: subcategory.Id,
            MinPrice: 400,
            MaxPrice: 500,
            Condition: ProductCondition.LikeNew,
            Size: "M",
            PageNumber: 1,
            PageSize: 12
        );

        var result = await handler.Handle(query, CancellationToken.None);

        result.TotalCount.Should().Be(1);
        result.PageSize.Should().Be(12);
        result.Items[0].Title.Should().Be("Silk Shirt Medium");
        result.Items[0].Size.Should().Be("M");
    }

    [Fact]
    public async Task GetMyFavorites_ReflectsUpdatedProductStatus()
    {
        var userId = Guid.NewGuid();
        var category = new Category { Id = Guid.NewGuid(), Name = "Tech", Slug = "tech" };
        _context.Categories.Add(category);

        var product = new Product
        {
            Id = Guid.NewGuid(),
            Title = "Smartphone",
            Slug = "smartphone",
            Description = "Good phone",
            Price = 1000,
            CategoryId = category.Id,
            Status = ProductStatus.Reserved,
            SellerId = Guid.NewGuid()
        };
        _context.Products.Add(product);

        _context.Favorites.Add(new Favorite
        {
            UserId = userId,
            ProductId = product.Id,
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        var handler = new GetMyFavoritesQueryHandler(_context);
        var query = new GetMyFavoritesQuery(userId);

        var result = await handler.Handle(query, CancellationToken.None);

        result.Should().HaveCount(1);
        result[0].Status.Should().Be("Reserved");
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
            .WithMessage("*محتوى الملف غير صالح ولا يطابق صيغ الصور المدعومة*");
    }

    [Fact]
    public async Task UploadProductImage_WithOversizedFile_ShouldThrowValidationException()
    {
        var storage = Substitute.For<IImageStorageService>();
        var handler = new UploadProductImageCommandHandler(storage);

        var pngHeader = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
        using var stream = new MemoryStream(pngHeader);

        // Simulated file length exceeding 5 MB (5,242,881 bytes)
        var command = new UploadProductImageCommand(stream, "large.png", "image/png", 5 * 1024 * 1024 + 1);

        var act = async () => await handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*حجم الصورة يتجاوز الحد الأقصى المسموح به (5 ميجابايت).*");
    }

    [Fact]
    public async Task UploadProductImage_WithInvalidExtension_ShouldThrowValidationException()
    {
        var storage = Substitute.For<IImageStorageService>();
        var handler = new UploadProductImageCommandHandler(storage);

        byte[] sampleBytes = new byte[] { 0x00, 0x01, 0x02, 0x03 };
        using var stream = new MemoryStream(sampleBytes);

        var command = new UploadProductImageCommand(stream, "file.exe", "image/png", sampleBytes.Length);

        var act = async () => await handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*صيغة الملف غير مدعومة. يسمح فقط بصور من نوع (JPG, JPEG, PNG, WebP).*");
    }

    [Fact]
    public async Task UploadProductImage_WithInvalidMimeType_ShouldThrowValidationException()
    {
        var storage = Substitute.For<IImageStorageService>();
        var handler = new UploadProductImageCommandHandler(storage);

        byte[] pngHeader = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
        using var stream = new MemoryStream(pngHeader);

        var command = new UploadProductImageCommand(stream, "sample.png", "application/octet-stream", pngHeader.Length);

        var act = async () => await handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*نوع الملف (MIME type) غير مدعوم. يسمح فقط بصور من نوع (JPG, JPEG, PNG, WebP).*");
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
    public async Task UploadProductImage_WithValidJpgHeader_ShouldSaveImage()
    {
        var storage = Substitute.For<IImageStorageService>();
        storage.SaveImageAsync(Arg.Any<Stream>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns("/uploads/safe.jpg");

        var handler = new UploadProductImageCommandHandler(storage);

        // JPG Magic header: 0xFF, 0xD8, 0xFF
        byte[] jpgHeader = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46 };
        using var stream = new MemoryStream(jpgHeader);

        var command = new UploadProductImageCommand(stream, "sample.jpeg", "image/jpeg", jpgHeader.Length);

        var result = await handler.Handle(command, CancellationToken.None);

        result.Should().Be("/uploads/safe.jpg");
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

    [Fact]
    public async Task UpdateProduct_WhenApprovedOrPublished_ResetsIsApprovedToFalseAndStatusToPending()
    {
        var category = new Category { Id = Guid.NewGuid(), Name = "Clothing", Slug = "clothing", IsActive = true };
        var sellerId = Guid.NewGuid();
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Title = "Original Approved Title",
            Slug = "original-approved-title",
            Price = 200m,
            SellerId = sellerId,
            CategoryId = category.Id,
            Category = category,
            Status = ProductStatus.Published,
            IsApproved = true
        };
        _context.Categories.Add(category);
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var handler = new TheAgency.Application.Marketplace.Commands.UpdateProduct.UpdateProductCommandHandler(_context);
        var command = new TheAgency.Application.Marketplace.Commands.UpdateProduct.UpdateProductCommand(
            product.Id,
            sellerId,
            Title: "Updated Product Title",
            Description: "Updated description text",
            Price: 250m,
            Condition: "LikeNew",
            Status: "Published",
            ImageUrl: "/uploads/updated.jpg"
        );

        var updatedDto = await handler.Handle(command, CancellationToken.None);

        updatedDto.Title.Should().Be("Updated Product Title");
        updatedDto.Status.Should().Be(ProductStatus.Pending.ToString());

        var dbProduct = await _context.Products.FindAsync(product.Id);
        dbProduct!.IsApproved.Should().BeFalse();
        dbProduct.Status.Should().Be(ProductStatus.Pending);
    }

    [Fact]
    public void CreateProductValidator_WithEmptyImageUrl_ShouldHaveValidationError()
    {
        var validator = new CreateProductCommandValidator();
        var command = new CreateProductCommand(
            SellerId: Guid.NewGuid(),
            Title: "Valid Title Here",
            Description: "Valid Description text that meets min length requirement",
            Price: 100m,
            Condition: "New",
            CategoryId: Guid.NewGuid(),
            ImageUrl: "",
            Location: "طنطا"
        );

        var result = validator.Validate(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "ImageUrl" && e.ErrorMessage.Contains("يرجى رفع صورتين حقيقيتين على الأقل للقطعة المعروضة."));
    }

    [Theory]
    [InlineData("تواصل معي على 01012345678 للتفاصيل")]
    [InlineData("رقم التليفون +201198765432 شكراً")]
    [InlineData("واتساب 012-3456-7890 للتواصل السريع")]
    [InlineData("صفحتي على facebook.com/shop123")]
    [InlineData("انستجرام wa.me/201012345678")]
    public void ContactInfoDetector_WithContactDetails_ShouldReturnTrue(string text)
    {
        var result = ContactInfoDetector.ContainsContactInfo(text);
        result.Should().BeTrue();
    }

    [Fact]
    public void ContactInfoDetector_WithCleanText_ShouldReturnFalse()
    {
        var text = "معطف صوف كلاسيكي ممتاز بدون أي عيوب أو استخدام مفرط.";
        var result = ContactInfoDetector.ContainsContactInfo(text);
        result.Should().BeFalse();
    }

    [Fact]
    public void CreateProductValidator_WithContactInfoInDescription_ShouldFailValidation()
    {
        var validator = new CreateProductCommandValidator();
        var command = new CreateProductCommand(
            SellerId: Guid.NewGuid(),
            Title: "معطف صوف فاخر",
            Description: "معطف ممتاز جداً، للتواصل المباشر اتصل على 01012345678 أو واتساب.",
            Price: 200m,
            Condition: "New",
            CategoryId: Guid.NewGuid(),
            ImageUrl: "/uploads/coat.jpg",
            Location: "طنطا"
        );

        var result = validator.Validate(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("يُمنع كتابة أرقام الهواتف أو الروابط الخارجية لضمان أمان المعاملات"));
    }
}
