using FluentAssertions;
using TheAgency.Application.Orders.Services;
using Xunit;

namespace TheAgency.Tests.Unit.Orders;

public class CommissionFeeCalculatorTests
{
    [Fact]
    public void CalculateOrderFinancials_CalculatesExactCommissionSplitsAndAccountingInvariant()
    {
        decimal itemPrice = 100.00m;

        var financials = CommissionFeeCalculator.CalculateOrderFinancials(itemPrice);

        financials.ItemPrice.Should().Be(100.00m);
        financials.DeliveryFee.Should().Be(30.00m);
        financials.BuyerFee.Should().Be(10.00m);               // 10% of 100
        financials.SellerCommission.Should().Be(10.00m);        // 10% of 100
        financials.NetSellerPayout.Should().Be(90.00m);          // 100 - 10
        financials.CourierEarnings.Should().Be(25.50m);         // 30 - 4.50 (15% cut)
        financials.PlatformEarnings.Should().Be(24.50m);        // 10 + 10 + 4.50
        financials.TotalAmountPayableByBuyer.Should().Be(140.00m); // 100 + 30 + 10

        // Accounting invariant check
        decimal totalAllocated = financials.NetSellerPayout + financials.CourierEarnings + financials.PlatformEarnings;
        totalAllocated.Should().Be(financials.TotalAmountPayableByBuyer);
    }

    [Fact]
    public void CalculateReturnFinancials_CalculatesReturnFeesAndBuyerRefund()
    {
        decimal itemPrice = 100.00m;
        decimal totalAmountPaid = 140.00m;

        var returns = CommissionFeeCalculator.CalculateReturnFinancials(itemPrice, totalAmountPaid);

        returns.FixedReturnFee.Should().Be(20.00m);
        returns.ReturnPercentageFee.Should().Be(0.00m);
        returns.TotalReturnCost.Should().Be(20.00m);           // 20 fixed
        returns.NetBuyerRefund.Should().Be(120.00m);           // 140 - 20
        returns.PlatformReturnEarnings.Should().Be(20.00m);
    }
}
