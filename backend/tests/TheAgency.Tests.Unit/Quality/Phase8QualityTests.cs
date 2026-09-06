using FluentAssertions;
using TheAgency.Application.Orders.Services;
using TheAgency.Domain.Enums;
using TheAgency.Domain.Services;
using TheAgency.Infrastructure.Services;
using Xunit;

namespace TheAgency.Tests.Unit.Quality;

public sealed class Phase8QualityTests
{
    [Theory]
    [InlineData(100.0, 10.0, 10.0, 30.0)] // 10% buyer fee, 10% seller fee, 30 flat delivery
    [InlineData(250.0, 25.0, 25.0, 30.0)]
    [InlineData(0.0, 0.0, 0.0, 30.0)]
    public void CommissionFeeCalculator_ShouldComputeServerAuthoritativeFeesCorrectly(
        decimal itemPrice, decimal expectedBuyerFee, decimal expectedSellerFee, decimal expectedDeliveryFee)
    {
        // Act
        var financials = CommissionFeeCalculator.CalculateOrderFinancials(itemPrice);

        // Assert
        financials.BuyerFee.Should().Be(expectedBuyerFee);
        financials.SellerCommission.Should().Be(expectedSellerFee);
        financials.DeliveryFee.Should().Be(expectedDeliveryFee);
        financials.TotalAmountPayableByBuyer.Should().Be(itemPrice + expectedBuyerFee + expectedDeliveryFee);
    }

    [Fact]
    [Trait("Category", "DomainUnit")]
    public void OrderStateMachine_ShouldEnforceStrictValidTransitionsAndRejectInvalidOnes()
    {
        // Valid Transitions
        OrderStateMachine.IsValidTransition(OrderStatus.PendingPayment, OrderStatus.Paid).Should().BeTrue();
        OrderStateMachine.IsValidTransition(OrderStatus.Paid, OrderStatus.Processing).Should().BeTrue();
        OrderStateMachine.IsValidTransition(OrderStatus.Processing, OrderStatus.OutForDelivery).Should().BeTrue();
        OrderStateMachine.IsValidTransition(OrderStatus.OutForDelivery, OrderStatus.Delivered).Should().BeTrue();
        OrderStateMachine.IsValidTransition(OrderStatus.Delivered, OrderStatus.ReturnRequested).Should().BeTrue();
        OrderStateMachine.IsValidTransition(OrderStatus.ReturnRequested, OrderStatus.Returned).Should().BeTrue();

        // Invalid Illegal Transitions (Rule 8/9 Security state invariant)
        OrderStateMachine.IsValidTransition(OrderStatus.PendingPayment, OrderStatus.Delivered).Should().BeFalse();
        OrderStateMachine.IsValidTransition(OrderStatus.Cancelled, OrderStatus.Paid).Should().BeFalse();
        OrderStateMachine.IsValidTransition(OrderStatus.Delivered, OrderStatus.Cancelled).Should().BeFalse();
    }

    [Fact]
    [Trait("Category", "SecurityUnit")]
    public void PasswordHasher_ShouldCorrectlyHashAndVerifyPasswords()
    {
        // Arrange
        var hasher = new PasswordHasher();
        var password = "SecureP@ssword2026!";

        // Act
        var hash = hasher.HashPassword(password);
        var isValid = hasher.VerifyPassword(password, hash);
        var isInvalid = hasher.VerifyPassword("WrongPassword!", hash);

        // Assert
        hash.Should().NotBeNullOrEmpty();
        isValid.Should().BeTrue();
        isInvalid.Should().BeFalse();
    }
}
