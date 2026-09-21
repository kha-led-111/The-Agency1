using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Orders.Queries.GetMyOrders;
using TheAgency.Application.Orders.Queries.GetPendingAdminOrders;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;
using TheAgency.Infrastructure.Persistence;
using Xunit;

namespace TheAgency.Tests.Unit.Orders;

public class OrderQueryFilteringTests
{
    private readonly ApplicationDbContext _context;

    public OrderQueryFilteringTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
    }

    [Fact]
    public async Task GetBuyerOrders_ShouldReturnAllOrdersForUser_RegardlessOfStatus()
    {
        // Arrange
        var buyerId = Guid.NewGuid();
        var category = new Category { Id = Guid.NewGuid(), Name = "ملابس", Slug = "clothing" };
        var seller = new User { Id = Guid.NewGuid(), FirstName = "Seller", LastName = "One", Email = "seller@example.com" };

        var product1 = new Product { Id = Guid.NewGuid(), Title = "P1", Slug = "p1", Description = "D1", Price = 100, CategoryId = category.Id, SellerId = seller.Id, IsApproved = true };
        var product2 = new Product { Id = Guid.NewGuid(), Title = "P2", Slug = "p2", Description = "D2", Price = 200, CategoryId = category.Id, SellerId = seller.Id, IsApproved = true };

        _context.Categories.Add(category);
        _context.Users.Add(seller);
        _context.Products.AddRange(product1, product2);

        var order1 = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "ORD-001",
            BuyerId = buyerId,
            Status = OrderStatus.PendingAdminReview,
            ShippingAddress = "Cairo",
            CreatedAtUtc = DateTime.UtcNow.AddHours(-2)
        };

        var order2 = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "ORD-002",
            BuyerId = buyerId,
            Status = OrderStatus.Delivered,
            ShippingAddress = "Alex",
            CreatedAtUtc = DateTime.UtcNow.AddHours(-1)
        };

        _context.Orders.AddRange(order1, order2);
        await _context.SaveChangesAsync();

        var handler = new GetMyOrdersQueryHandler(_context);

        // Act
        var result = await handler.Handle(new GetMyOrdersQuery(buyerId, OrderRoleFilter.Buyer), CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        result.Select(o => o.Id).Should().Contain(new[] { order1.Id, order2.Id });
    }

    [Fact]
    public async Task GetPendingAdminOrders_ShouldReturnOnlyPendingAdminReviewOrders()
    {
        // Arrange
        var buyerId = Guid.NewGuid();
        var pendingOrder = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "ORD-PENDING",
            BuyerId = buyerId,
            Status = OrderStatus.PendingAdminReview,
            ShippingAddress = "Tanta",
            CreatedAtUtc = DateTime.UtcNow.AddMinutes(-30)
        };

        var deliveredOrder = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "ORD-DELIVERED",
            BuyerId = buyerId,
            Status = OrderStatus.Delivered,
            ShippingAddress = "Mansoura",
            CreatedAtUtc = DateTime.UtcNow.AddMinutes(-10)
        };

        _context.Orders.AddRange(pendingOrder, deliveredOrder);
        await _context.SaveChangesAsync();

        var handler = new GetPendingAdminOrdersQueryHandler(_context);

        // Act
        var result = await handler.Handle(new GetPendingAdminOrdersQuery(), CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result[0].Id.Should().Be(pendingOrder.Id);
        result[0].Status.Should().Be(OrderStatus.PendingAdminReview.ToString());
    }
}
