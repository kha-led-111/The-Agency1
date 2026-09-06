using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Orders.Commands.CancelOrder;
using TheAgency.Application.Orders.Commands.CreateOrder;
using TheAgency.Application.Orders.Queries.GetMyOrders;
using TheAgency.Application.Orders.Queries.GetOrderById;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;
using TheAgency.Infrastructure.Persistence;
using Xunit;

namespace TheAgency.Tests.Unit.Orders;

public class OrderUnitTests
{
    private readonly ApplicationDbContext _context;

    public OrderUnitTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
    }

    [Fact]
    public async Task CreateOrder_CalculatesServerAuthoritativeTotalAndReservesProduct()
    {
        var buyerId = Guid.NewGuid();
        var sellerId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();

        var product = new Product
        {
            Id = Guid.NewGuid(),
            Title = "Vintage Camera",
            Price = 250.00m,
            SellerId = sellerId,
            CategoryId = categoryId,
            Status = ProductStatus.Published,
            IsApproved = true
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var handler = new CreateOrderCommandHandler(_context);
        var command = new CreateOrderCommand(buyerId, new[] { product.Id }, "123 Main St, Cairo, Egypt");

        var order = await handler.Handle(command, CancellationToken.None);

        // Rule 8: Server-authoritative totals (250 item + 30 delivery fee + 25.00 buyer fee = 305.00 total)
        order.TotalAmount.Should().Be(305.00m);
        order.DeliveryFee.Should().Be(30.00m);
        order.Status.Should().Be(OrderStatus.PendingPayment.ToString());

        var dbProduct = await _context.Products.FindAsync(product.Id);
        dbProduct!.Status.Should().Be(ProductStatus.Reserved);
        dbProduct.BuyerId.Should().Be(buyerId);
    }

    [Fact]
    public async Task CreateOrder_WithIdempotencyKey_ShouldReturnExistingOrderOnRetry()
    {
        var buyerId = Guid.NewGuid();
        var sellerId = Guid.NewGuid();
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Title = "Laptop",
            Price = 1000m,
            SellerId = sellerId,
            Status = ProductStatus.Published,
            IsApproved = true
        };
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var handler = new CreateOrderCommandHandler(_context);
        var key = "idempotency-key-123";
        var command = new CreateOrderCommand(buyerId, new[] { product.Id }, "123 Street", key);

        var firstResult = await handler.Handle(command, CancellationToken.None);
        var secondResult = await handler.Handle(command, CancellationToken.None);

        secondResult.Id.Should().Be(firstResult.Id);
        secondResult.OrderNumber.Should().Be(firstResult.OrderNumber);
    }

    [Fact]
    public async Task CreateOrder_WhenBuyerIsSeller_ShouldThrowValidationException()
    {
        var sellerId = Guid.NewGuid();
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Title = "Own Item",
            Price = 100m,
            SellerId = sellerId,
            Status = ProductStatus.Published,
            IsApproved = true
        };
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var handler = new CreateOrderCommandHandler(_context);
        var command = new CreateOrderCommand(sellerId, new[] { product.Id }, "Self Address");

        var act = async () => await handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*cannot purchase their own product*");
    }

    [Fact]
    public async Task CancelOrder_RestoresProductStatusToPublished()
    {
        var buyerId = Guid.NewGuid();
        var sellerId = Guid.NewGuid();
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Title = "Item to cancel",
            Price = 80m,
            SellerId = sellerId,
            Status = ProductStatus.Published,
            IsApproved = true
        };
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var createHandler = new CreateOrderCommandHandler(_context);
        var order = await createHandler.Handle(new CreateOrderCommand(buyerId, new[] { product.Id }, "Test Addr"), CancellationToken.None);

        var cancelHandler = new CancelOrderCommandHandler(_context);
        var cancelledOrder = await cancelHandler.Handle(new CancelOrderCommand(order.Id, buyerId), CancellationToken.None);

        cancelledOrder.Status.Should().Be(OrderStatus.Cancelled.ToString());

        var restoredProduct = await _context.Products.FindAsync(product.Id);
        restoredProduct!.Status.Should().Be(ProductStatus.Published);
        restoredProduct.BuyerId.Should().BeNull();
    }
}
