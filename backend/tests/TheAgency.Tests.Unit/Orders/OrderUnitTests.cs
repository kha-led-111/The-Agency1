using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Notifications.Interfaces;
using TheAgency.Application.Orders.Commands.CancelOrder;
using TheAgency.Application.Orders.Commands.ConfirmSellerAvailability;
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
        order.Status.Should().Be(OrderStatus.PendingAdminReview.ToString());
        order.DeliveryAgentId.Should().BeNull();

        var dbProduct = await _context.Products.FindAsync(product.Id);
        dbProduct!.Status.Should().Be(ProductStatus.Reserved);
        dbProduct.BuyerId.Should().Be(buyerId);
    }

    [Fact]
    public async Task AssignDeliveryAgent_UpdatesOrderStatusAndAssignsAgent()
    {
        var buyer = new User { Id = Guid.NewGuid(), Email = "buyer@test.com", FirstName = "Buyer", LastName = "One" };
        var courier = new User { Id = Guid.NewGuid(), Email = "courier@test.com", FirstName = "Courier", LastName = "One", Role = UserRole.Courier, IsActive = true };

        _context.Users.AddRange(buyer, courier);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "ORD-TEST-001",
            BuyerId = buyer.Id,
            ShippingAddress = "123 Test St",
            Status = OrderStatus.PendingAdminReview,
            DeliveryAgentId = null
        };

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        var handler = new TheAgency.Application.Orders.Commands.AssignDeliveryAgent.AssignDeliveryAgentCommandHandler(_context);
        var command = new TheAgency.Application.Orders.Commands.AssignDeliveryAgent.AssignDeliveryAgentCommand(order.Id, courier.Id, "Admin Note");

        var result = await handler.Handle(command, CancellationToken.None);

        result.Status.Should().Be(OrderStatus.AssignedToDelivery.ToString());
        result.DeliveryAgentId.Should().Be(courier.Id);

        var dbOrder = await _context.Orders.FindAsync(order.Id);
        dbOrder!.DeliveryAgentId.Should().Be(courier.Id);
        dbOrder.Status.Should().Be(OrderStatus.AssignedToDelivery);

        var deliveryTask = await _context.DeliveryTasks.FirstOrDefaultAsync(d => d.OrderId == order.Id);
        deliveryTask.Should().NotBeNull();
        deliveryTask!.CourierId.Should().Be(courier.Id);
        deliveryTask.Status.Should().Be(DeliveryStatus.Assigned);
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
    public async Task CreateOrder_Within10Seconds_SameBuyerAndProduct_ReturnsExistingOrder()
    {
        var buyerId = Guid.NewGuid();
        var sellerId = Guid.NewGuid();
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Title = "Camera",
            Price = 500m,
            SellerId = sellerId,
            Status = ProductStatus.Published,
            IsApproved = true
        };
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var handler = new CreateOrderCommandHandler(_context);
        var command1 = new CreateOrderCommand(buyerId, new[] { product.Id }, "123 Street Cairo");
        var command2 = new CreateOrderCommand(buyerId, new[] { product.Id }, "123 Street Cairo");

        var firstResult = await handler.Handle(command1, CancellationToken.None);
        var secondResult = await handler.Handle(command2, CancellationToken.None);

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
            .WithMessage("*لا يمكنك شراء المنتجات التي قمت برفعها بنفسك*");
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

    [Fact]
    public async Task CancelOrder_ByAdmin_RestoresProductStatusToPublished()
    {
        var buyerId = Guid.NewGuid();
        var sellerId = Guid.NewGuid();
        var adminUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "admin@example.com",
            NormalizedEmail = "ADMIN@EXAMPLE.COM",
            FirstName = "System",
            LastName = "Admin",
            Role = UserRole.Admin,
            PasswordHash = "hash"
        };
        _context.Users.Add(adminUser);

        var product = new Product
        {
            Id = Guid.NewGuid(),
            Title = "Admin Cancelled Product",
            Price = 120m,
            SellerId = sellerId,
            Status = ProductStatus.Published,
            IsApproved = true
        };
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var createHandler = new CreateOrderCommandHandler(_context);
        var order = await createHandler.Handle(new CreateOrderCommand(buyerId, new[] { product.Id }, "Test Address"), CancellationToken.None);

        var cancelHandler = new CancelOrderCommandHandler(_context);
        var cancelledOrder = await cancelHandler.Handle(new CancelOrderCommand(order.Id, adminUser.Id), CancellationToken.None);

        cancelledOrder.Status.Should().Be(OrderStatus.Cancelled.ToString());

        var restoredProduct = await _context.Products.FindAsync(product.Id);
        restoredProduct!.Status.Should().Be(ProductStatus.Published);
        restoredProduct.BuyerId.Should().BeNull();
    }

    [Fact]
    public async Task CancelOrder_WhenInTransit_ShouldThrowValidationException()
    {
        var buyerId = Guid.NewGuid();
        var sellerId = Guid.NewGuid();
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Title = "In Transit Product",
            Price = 150m,
            SellerId = sellerId,
            Status = ProductStatus.Published,
            IsApproved = true
        };
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var createHandler = new CreateOrderCommandHandler(_context);
        var order = await createHandler.Handle(new CreateOrderCommand(buyerId, new[] { product.Id }, "Test Address"), CancellationToken.None);

        var dbOrder = await _context.Orders.FindAsync(order.Id);
        dbOrder!.Status = OrderStatus.OutForDelivery;
        await _context.SaveChangesAsync();

        var cancelHandler = new CancelOrderCommandHandler(_context);
        var act = async () => await cancelHandler.Handle(new CancelOrderCommand(dbOrder.Id, buyerId), CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*الطلب قيد التوصيل الآن، للإلغاء يرجى التواصل مع الدعم.*");
    }

    [Fact]
    public async Task CancelOrder_WhenPending_NotifiesSellerAndRevertsProductStatus()
    {
        var buyerId = Guid.NewGuid();
        var sellerId = Guid.NewGuid();
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Title = "Pending Order Product",
            Price = 200m,
            SellerId = sellerId,
            Status = ProductStatus.Published,
            IsApproved = true
        };
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var notificationService = Substitute.For<INotificationService>();

        var createHandler = new CreateOrderCommandHandler(_context);
        var order = await createHandler.Handle(new CreateOrderCommand(buyerId, new[] { product.Id }, "Test Address"), CancellationToken.None);

        var cancelHandler = new CancelOrderCommandHandler(_context, notificationService);
        var cancelledOrder = await cancelHandler.Handle(new CancelOrderCommand(order.Id, buyerId), CancellationToken.None);

        cancelledOrder.Status.Should().Be(OrderStatus.Cancelled.ToString());

        await notificationService.Received(1).CreateNotificationAsync(
            sellerId,
            Arg.Any<string>(),
            Arg.Any<string>(),
            NotificationType.InApp,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CreateOrder_WithInvalidEgyptianPhone_ShouldThrowValidationException()
    {
        var buyerId = Guid.NewGuid();
        var sellerId = Guid.NewGuid();
        var buyer = new User
        {
            Id = buyerId,
            Email = "invalidphone@example.com",
            NormalizedEmail = "INVALIDPHONE@EXAMPLE.COM",
            FirstName = "Test",
            LastName = "Buyer",
            PhoneNumber = "02234567890",
            PasswordHash = "hash"
        };
        _context.Users.Add(buyer);

        var product = new Product
        {
            Id = Guid.NewGuid(),
            Title = "Product Phone Test",
            Price = 100m,
            SellerId = sellerId,
            Status = ProductStatus.Published,
            IsApproved = true
        };
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var handler = new CreateOrderCommandHandler(_context);
        var command = new CreateOrderCommand(buyerId, new[] { product.Id }, "123 Street Cairo");

        var act = async () => await handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*يلزم وجود رقم هاتف مصري صالح (11 رقم يبدأ بـ 01)*");
    }

    [Fact]
    public async Task CreateOrder_WithInvalidEgyptianMobilePrefix_ShouldThrowValidationException()
    {
        var buyerId = Guid.NewGuid();
        var sellerId = Guid.NewGuid();

        var buyer = new User
        {
            Id = buyerId,
            Email = "invalidprefix@example.com",
            PhoneNumber = "01300000000" // 013 is not a valid Egyptian mobile prefix
        };
        _context.Users.Add(buyer);

        var product = new Product
        {
            Id = Guid.NewGuid(),
            Title = "Product Prefix Test",
            Price = 100m,
            SellerId = sellerId,
            Status = ProductStatus.Published,
            IsApproved = true
        };
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var handler = new CreateOrderCommandHandler(_context);
        var command = new CreateOrderCommand(buyerId, new[] { product.Id }, "123 Street Cairo");

        var act = async () => await handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*يلزم وجود رقم هاتف مصري صالح (11 رقم يبدأ بـ 01)*");
    }

    [Fact]
    public async Task CreateOrder_WithIncompleteAddress_ShouldThrowValidationException()
    {
        var buyerId = Guid.NewGuid();
        var sellerId = Guid.NewGuid();
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Title = "Product Address Test",
            Price = 100m,
            SellerId = sellerId,
            Status = ProductStatus.Published,
            IsApproved = true
        };
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var handler = new CreateOrderCommandHandler(_context);
        var command = new CreateOrderCommand(buyerId, new[] { product.Id }, "   ");

        var act = async () => await handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*عنوان التوصيل غير مكتمل*");
    }

    [Fact]
    public async Task ConfirmSellerAvailability_WhenAvailable_TransitionsToProcessing()
    {
        var buyerId = Guid.NewGuid();
        var sellerId = Guid.NewGuid();
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Title = "Item Available Test",
            Price = 150m,
            SellerId = sellerId,
            Status = ProductStatus.Reserved,
            IsApproved = true
        };
        _context.Products.Add(product);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "ORD-AVAIL-01",
            BuyerId = buyerId,
            Status = OrderStatus.PendingSellerConfirmation,
            ShippingAddress = "123 Street Cairo"
        };
        order.OrderItems.Add(new OrderItem { OrderId = order.Id, ProductId = product.Id, Product = product, UnitPrice = 150m });
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        var handler = new ConfirmSellerAvailabilityCommandHandler(_context);
        var command = new ConfirmSellerAvailabilityCommand(order.Id, sellerId, IsAvailable: true);

        var result = await handler.Handle(command, CancellationToken.None);

        result.Status.Should().Be(OrderStatus.Processing.ToString());
        var dbOrder = await _context.Orders.FindAsync(order.Id);
        dbOrder!.Status.Should().Be(OrderStatus.Processing);
    }

    [Fact]
    public async Task ConfirmSellerAvailability_WhenUnavailable_CancelsOrder_RevertsProduct_AndIncrementsSellerPenalty()
    {
        var buyerId = Guid.NewGuid();
        var sellerId = Guid.NewGuid();

        var sellerUser = new User
        {
            Id = sellerId,
            Email = "seller@example.com",
            PenaltyPoints = 0
        };
        _context.Users.Add(sellerUser);

        var product = new Product
        {
            Id = Guid.NewGuid(),
            Title = "Item Unavailable Test",
            Price = 200m,
            SellerId = sellerId,
            Status = ProductStatus.Reserved,
            IsApproved = true
        };
        _context.Products.Add(product);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "ORD-UNAVAIL-01",
            BuyerId = buyerId,
            Status = OrderStatus.PendingSellerConfirmation,
            ShippingAddress = "456 Street Tanta"
        };
        order.OrderItems.Add(new OrderItem { OrderId = order.Id, ProductId = product.Id, Product = product, UnitPrice = 200m });
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        var handler = new ConfirmSellerAvailabilityCommandHandler(_context);
        var command = new ConfirmSellerAvailabilityCommand(order.Id, sellerId, IsAvailable: false, Reason: "Out of stock");

        var result = await handler.Handle(command, CancellationToken.None);

        result.Status.Should().Be(OrderStatus.Cancelled.ToString());

        var dbOrder = await _context.Orders.FindAsync(order.Id);
        dbOrder!.Status.Should().Be(OrderStatus.Cancelled);

        var dbProduct = await _context.Products.FindAsync(product.Id);
        dbProduct!.Status.Should().Be(ProductStatus.Published);
        dbProduct.BuyerId.Should().BeNull();

        var dbSeller = await _context.Users.FindAsync(sellerId);
        dbSeller!.PenaltyPoints.Should().Be(1);
    }
}
