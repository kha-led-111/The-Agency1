using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using TheAgency.Application.Admin.Commands.ApproveProduct;
using TheAgency.Application.Admin.Queries.GetPendingProducts;
using TheAgency.Application.Notifications.Interfaces;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;
using TheAgency.Infrastructure.Persistence;
using Xunit;

namespace TheAgency.Tests.Unit.Admin;

public class AdminApprovalTests
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;

    public AdminApprovalTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _notificationService = Substitute.For<INotificationService>();
    }

    [Fact]
    public async Task ApproveProduct_ShouldSetIsApprovedTrueAndSetApprovedAt()
    {
        // Arrange
        var category = new Category { Id = Guid.NewGuid(), Name = "ملابس", Slug = "clothing" };
        var seller = new User { Id = Guid.NewGuid(), FirstName = "Ahmed", LastName = "Ali", Email = "ahmed@example.com" };
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Title = "قميص كلاسيك",
            Slug = "classic-shirt",
            Description = "قميص قطن",
            Price = 250,
            CategoryId = category.Id,
            SellerId = seller.Id,
            IsApproved = false,
            Status = ProductStatus.Pending
        };

        _context.Categories.Add(category);
        _context.Users.Add(seller);
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var handler = new ApproveProductCommandHandler(_context, _notificationService);

        // Act
        var result = await handler.Handle(new ApproveProductCommand(product.Id), CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.IsApproved.Should().BeTrue();
        result.Status.Should().Be(ProductStatus.Published);
        result.ApprovedAt.Should().NotBeNull();

        var dbProduct = await _context.Products.FindAsync(product.Id);
        dbProduct.Should().NotBeNull();
        dbProduct!.IsApproved.Should().BeTrue();
        dbProduct.ApprovedAt.Should().NotBeNull();
        dbProduct.Status.Should().Be(ProductStatus.Published);
    }

    [Fact]
    public async Task GetPendingProducts_ShouldExcludeApprovedProducts()
    {
        // Arrange
        var category = new Category { Id = Guid.NewGuid(), Name = "إلكترونيات", Slug = "electronics" };
        var seller = new User { Id = Guid.NewGuid(), FirstName = "Mohamed", LastName = "Hassan", Email = "mohamed@example.com" };

        var unapprovedProduct = new Product
        {
            Id = Guid.NewGuid(),
            Title = "ساعة ذكية غير معتمدة",
            Slug = "smart-watch-pending",
            Description = "وصف",
            Price = 500,
            CategoryId = category.Id,
            SellerId = seller.Id,
            IsApproved = false,
            Status = ProductStatus.Pending
        };

        var approvedProduct = new Product
        {
            Id = Guid.NewGuid(),
            Title = "ساعة معتمدة",
            Slug = "smart-watch-approved",
            Description = "وصف",
            Price = 600,
            CategoryId = category.Id,
            SellerId = seller.Id,
            IsApproved = true,
            ApprovedAt = DateTime.UtcNow,
            Status = ProductStatus.Published
        };

        _context.Categories.Add(category);
        _context.Users.Add(seller);
        _context.Products.AddRange(unapprovedProduct, approvedProduct);
        await _context.SaveChangesAsync();

        var queryHandler = new GetPendingProductsForAdminQueryHandler(_context);

        // Act
        var result = await queryHandler.Handle(new GetPendingProductsForAdminQuery(), CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result[0].Id.Should().Be(unapprovedProduct.Id);
        result[0].IsApproved.Should().BeFalse();
    }

    [Fact]
    public async Task GetPendingProducts_WhenAllProductsApproved_ShouldReturnEmptyList()
    {
        // Arrange
        var category = new Category { Id = Guid.NewGuid(), Name = "كتب", Slug = "books" };
        var seller = new User { Id = Guid.NewGuid(), FirstName = "Sara", LastName = "Khaled", Email = "sara@example.com" };

        var approvedProduct = new Product
        {
            Id = Guid.NewGuid(),
            Title = "كتاب التاريخ",
            Slug = "history-book",
            Description = "وصف الكتاب",
            Price = 120,
            CategoryId = category.Id,
            SellerId = seller.Id,
            IsApproved = true,
            ApprovedAt = DateTime.UtcNow,
            Status = ProductStatus.Published
        };

        _context.Categories.Add(category);
        _context.Users.Add(seller);
        _context.Products.Add(approvedProduct);
        await _context.SaveChangesAsync();

        var queryHandler = new GetPendingProductsForAdminQueryHandler(_context);

        // Act
        var result = await queryHandler.Handle(new GetPendingProductsForAdminQuery(), CancellationToken.None);

        // Assert
        result.Should().BeEmpty();
    }
}
