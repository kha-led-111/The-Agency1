using System;
using FluentAssertions;
using TheAgency.Domain.Enums;
using TheAgency.Domain.Services;
using Xunit;

namespace TheAgency.Tests.Unit.Orders;

public class OrderStateMachineTests
{
    [Theory]
    [InlineData(OrderStatus.PendingPayment, OrderStatus.Paid)]
    [InlineData(OrderStatus.PendingPayment, OrderStatus.Cancelled)]
    [InlineData(OrderStatus.Paid, OrderStatus.Processing)]
    [InlineData(OrderStatus.Paid, OrderStatus.Cancelled)]
    [InlineData(OrderStatus.Processing, OrderStatus.OutForDelivery)]
    [InlineData(OrderStatus.Processing, OrderStatus.Cancelled)]
    [InlineData(OrderStatus.OutForDelivery, OrderStatus.Delivered)]
    [InlineData(OrderStatus.OutForDelivery, OrderStatus.FailedDelivery)]
    [InlineData(OrderStatus.FailedDelivery, OrderStatus.OutForDelivery)]
    [InlineData(OrderStatus.FailedDelivery, OrderStatus.Returned)]
    [InlineData(OrderStatus.Delivered, OrderStatus.ReturnRequested)]
    [InlineData(OrderStatus.ReturnRequested, OrderStatus.Returned)]
    [InlineData(OrderStatus.ReturnRequested, OrderStatus.Delivered)]
    public void IsValidTransition_PermittedTransitions_ReturnsTrue(OrderStatus current, OrderStatus target)
    {
        var result = OrderStateMachine.IsValidTransition(current, target);
        result.Should().BeTrue();
    }

    [Theory]
    [InlineData(OrderStatus.PendingPayment, OrderStatus.Delivered)]
    [InlineData(OrderStatus.PendingPayment, OrderStatus.OutForDelivery)]
    [InlineData(OrderStatus.Cancelled, OrderStatus.Paid)]
    [InlineData(OrderStatus.Returned, OrderStatus.Delivered)]
    public void IsValidTransition_InvalidTransitions_ReturnsFalse(OrderStatus current, OrderStatus target)
    {
        var result = OrderStateMachine.IsValidTransition(current, target);
        result.Should().BeFalse();
    }

    [Fact]
    [System.Diagnostics.CodeAnalysis.SuppressMessage("Assertions", "xUnit2017:ScoreOfConstraintIsStatic", Justification = "Testing state machine authorization rules")]
    public void CanUserTransitionOrder_BuyerCancelsPaidOrder_ReturnsTrue()
    {
        var canTransition = OrderStateMachine.CanUserTransitionOrder(
            OrderStatus.Paid,
            OrderStatus.Cancelled,
            UserRole.Buyer,
            isBuyer: true,
            isSeller: false);

        canTransition.Should().BeTrue();
    }

    [Fact]
    public void CanUserTransitionOrder_UnauthorizedRole_ReturnsFalse()
    {
        var canTransition = OrderStateMachine.CanUserTransitionOrder(
            OrderStatus.Processing,
            OrderStatus.OutForDelivery,
            UserRole.Buyer, // Only Courier or Admin can mark OutForDelivery
            isBuyer: true,
            isSeller: false);

        canTransition.Should().BeFalse();
    }

    [Fact]
    public void ValidateTransition_InvalidTransition_ThrowsInvalidOperationException()
    {
        Action act = () => OrderStateMachine.ValidateTransition(
            OrderStatus.Cancelled,
            OrderStatus.Paid,
            UserRole.Admin,
            isBuyer: false,
            isSeller: false);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Invalid order status transition*");
    }

    [Fact]
    public void ValidateTransition_UnauthorizedUser_ThrowsUnauthorizedAccessException()
    {
        Action act = () => OrderStateMachine.ValidateTransition(
            OrderStatus.Processing,
            OrderStatus.OutForDelivery,
            UserRole.Buyer,
            isBuyer: true,
            isSeller: false);

        act.Should().Throw<UnauthorizedAccessException>()
            .WithMessage("*is not authorized to transition order status*");
    }
}
