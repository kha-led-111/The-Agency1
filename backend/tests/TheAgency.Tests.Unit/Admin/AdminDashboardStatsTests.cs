using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Admin.Queries.GetDashboardStats;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;
using TheAgency.Infrastructure.Persistence;
using Xunit;

namespace TheAgency.Tests.Unit.Admin;

public class AdminDashboardStatsTests
{
    private readonly ApplicationDbContext _context;

    public AdminDashboardStatsTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
    }

    [Fact]
    public async Task Handle_WithEmptyDatabase_ShouldReturnDefaultMetrics()
    {
        // Arrange
        var handler = new GetAdminDashboardStatsQueryHandler(_context);

        // Act
        var result = await handler.Handle(new GetAdminDashboardStatsQuery(), CancellationToken.None);

        // Assert
        result.ActiveSellersCount.Should().Be(0);
        result.CompletedOrdersCount.Should().Be(0);
        result.VerifiedBuyersCount.Should().Be(0);
        result.VerifiedBuyersPercentage.Should().Be(100.0);
        result.AverageRating.Should().Be(4.95);
        result.TotalRevenue.Should().Be(0.00m);
        result.PendingProductsCount.Should().Be(0);
        result.PendingOrdersCount.Should().Be(0);
        result.TotalUsersCount.Should().Be(0);
    }

    [Fact]
    public async Task Handle_WithPopulatedDatabase_ShouldCalculateStatsAccurately()
    {
        // Arrange
        var seller = new User
        {
            Id = Guid.NewGuid(),
            Email = "seller@example.com",
            FirstName = "Active",
            LastName = "Seller",
            Role = UserRole.Seller,
            IsActive = true
        };

        var verifiedBuyer = new User
        {
            Id = Guid.NewGuid(),
            Email = "buyer1@example.com",
            FirstName = "Verified",
            LastName = "Buyer",
            Role = UserRole.Buyer,
            IsActive = true,
            EmailVerifiedAtUtc = DateTime.UtcNow
        };

        var unverifiedBuyer = new User
        {
            Id = Guid.NewGuid(),
            Email = "buyer2@example.com",
            FirstName = "Unverified",
            LastName = "Buyer",
            Role = UserRole.Buyer,
            IsActive = true,
            EmailVerifiedAtUtc = null
        };

        await _context.Users.AddRangeAsync(seller, verifiedBuyer, unverifiedBuyer);

        var approvedProduct = new Product
        {
            Id = Guid.NewGuid(),
            SellerId = seller.Id,
            CategoryId = Guid.NewGuid(),
            Title = "Approved Item",
            Slug = "approved-item",
            Description = "Test product description",
            Price = 150.00m,
            IsApproved = true
        };

        var pendingProduct = new Product
        {
            Id = Guid.NewGuid(),
            SellerId = seller.Id,
            CategoryId = Guid.NewGuid(),
            Title = "Pending Item",
            Slug = "pending-item",
            Description = "Test product description",
            Price = 200.00m,
            IsApproved = false
        };

        await _context.Products.AddRangeAsync(approvedProduct, pendingProduct);

        var deliveredOrder = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "ORD-100",
            BuyerId = verifiedBuyer.Id,
            TotalAmount = 180.00m,
            Status = OrderStatus.Delivered
        };

        var pendingReviewOrder = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "ORD-101",
            BuyerId = unverifiedBuyer.Id,
            TotalAmount = 220.00m,
            Status = OrderStatus.PendingAdminReview
        };

        await _context.Orders.AddRangeAsync(deliveredOrder, pendingReviewOrder);

        var courier = new CourierProfile
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Rating = 4.8m
        };

        await _context.CourierProfiles.AddAsync(courier);
        await _context.SaveChangesAsync();

        var handler = new GetAdminDashboardStatsQueryHandler(_context);

        // Act
        var result = await handler.Handle(new GetAdminDashboardStatsQuery(), CancellationToken.None);

        // Assert
        result.ActiveSellersCount.Should().Be(1);
        result.CompletedOrdersCount.Should().Be(1);
        result.VerifiedBuyersCount.Should().Be(1);
        result.VerifiedBuyersPercentage.Should().Be(50.0);
        result.AverageRating.Should().Be(4.8);
        result.TotalRevenue.Should().Be(180.00m);
        result.PendingProductsCount.Should().Be(1);
        result.PendingOrdersCount.Should().Be(1);
        result.TotalUsersCount.Should().Be(3);
    }
}
