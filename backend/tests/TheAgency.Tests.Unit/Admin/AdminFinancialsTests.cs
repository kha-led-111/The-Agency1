using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Admin.Queries.GetFinancialSummary;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;
using TheAgency.Infrastructure.Persistence;
using Xunit;

namespace TheAgency.Tests.Unit.Admin;

public class AdminFinancialsTests
{
    private readonly ApplicationDbContext _context;

    public AdminFinancialsTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
    }

    [Fact]
    public async Task Handle_WithNoOrders_ShouldReturnZeroMetrics()
    {
        // Arrange
        var handler = new GetAdminFinancialSummaryQueryHandler(_context);

        // Act
        var result = await handler.Handle(new GetAdminFinancialSummaryQuery(), CancellationToken.None);

        // Assert
        result.GrossSalesVolume.Should().Be(0.00m);
        result.TotalGrossItemSales.Should().Be(0.00m);
        result.TotalPlatformCommission.Should().Be(0.00m);
        result.TotalDeliveryFees.Should().Be(0.00m);
        result.TotalPendingSellerPayouts.Should().Be(0.00m);
        result.CompletedOrderCount.Should().Be(0);
        result.TotalOrderCount.Should().Be(0);
    }

    [Fact]
    public async Task Handle_WithOnlyDeliveredOrders_ShouldAggregateMetricsCorrectly()
    {
        // Arrange
        var order1 = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "ORD-001",
            BuyerId = Guid.NewGuid(),
            ItemPrice = 100.00m,
            DeliveryFee = 30.00m,
            BuyerFee = 10.00m,
            SellerCommission = 10.00m,
            CourierEarnings = 25.50m,
            PlatformEarnings = 24.50m,
            TotalAmount = 140.00m,
            Status = OrderStatus.Delivered
        };

        var order2 = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "ORD-002",
            BuyerId = Guid.NewGuid(),
            ItemPrice = 200.00m,
            DeliveryFee = 30.00m,
            BuyerFee = 20.00m,
            SellerCommission = 20.00m,
            CourierEarnings = 25.50m,
            PlatformEarnings = 44.50m,
            TotalAmount = 250.00m,
            Status = OrderStatus.Delivered
        };

        _context.Orders.AddRange(order1, order2);
        await _context.SaveChangesAsync();

        var handler = new GetAdminFinancialSummaryQueryHandler(_context);

        // Act
        var result = await handler.Handle(new GetAdminFinancialSummaryQuery(), CancellationToken.None);

        // Assert
        result.GrossSalesVolume.Should().Be(390.00m); // 140 + 250
        result.TotalGrossItemSales.Should().Be(300.00m); // 100 + 200
        result.TotalPlatformCommission.Should().Be(69.00m); // 24.50 + 44.50
        result.TotalDeliveryFees.Should().Be(60.00m); // 30 + 30
        result.TotalPendingSellerPayouts.Should().Be(270.00m); // (100 - 10) + (200 - 20) = 90 + 180 = 270
        result.CompletedOrderCount.Should().Be(2);
        result.TotalOrderCount.Should().Be(2);
    }

    [Fact]
    public async Task Handle_WithMixedOrderStatuses_ShouldOnlyIncludeDeliveredOrders()
    {
        // Arrange
        var deliveredOrder = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "ORD-DELIVERED",
            BuyerId = Guid.NewGuid(),
            ItemPrice = 500.00m,
            DeliveryFee = 30.00m,
            BuyerFee = 50.00m,
            SellerCommission = 50.00m,
            CourierEarnings = 25.50m,
            PlatformEarnings = 104.50m,
            TotalAmount = 580.00m,
            Status = OrderStatus.Delivered
        };

        var pendingOrder = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "ORD-PENDING",
            BuyerId = Guid.NewGuid(),
            ItemPrice = 1000.00m,
            DeliveryFee = 30.00m,
            BuyerFee = 100.00m,
            SellerCommission = 100.00m,
            PlatformEarnings = 204.50m,
            TotalAmount = 1130.00m,
            Status = OrderStatus.PendingPayment
        };

        var cancelledOrder = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "ORD-CANCELLED",
            BuyerId = Guid.NewGuid(),
            ItemPrice = 800.00m,
            DeliveryFee = 30.00m,
            BuyerFee = 80.00m,
            SellerCommission = 80.00m,
            PlatformEarnings = 164.50m,
            TotalAmount = 910.00m,
            Status = OrderStatus.Cancelled
        };

        var outForDeliveryOrder = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "ORD-OUT-FOR-DELIVERY",
            BuyerId = Guid.NewGuid(),
            ItemPrice = 400.00m,
            DeliveryFee = 30.00m,
            BuyerFee = 40.00m,
            SellerCommission = 40.00m,
            PlatformEarnings = 84.50m,
            TotalAmount = 470.00m,
            Status = OrderStatus.OutForDelivery
        };

        _context.Orders.AddRange(deliveredOrder, pendingOrder, cancelledOrder, outForDeliveryOrder);
        await _context.SaveChangesAsync();

        var handler = new GetAdminFinancialSummaryQueryHandler(_context);

        // Act
        var result = await handler.Handle(new GetAdminFinancialSummaryQuery(), CancellationToken.None);

        // Assert - Only deliveredOrder (580.00) should be included in financial revenue sums
        result.GrossSalesVolume.Should().Be(580.00m);
        result.TotalGrossItemSales.Should().Be(500.00m);
        result.TotalPlatformCommission.Should().Be(104.50m);
        result.TotalDeliveryFees.Should().Be(30.00m);
        result.TotalPendingSellerPayouts.Should().Be(450.00m); // 500 - 50 = 450
        result.CompletedOrderCount.Should().Be(1);
        result.TotalOrderCount.Should().Be(4);
    }
}
