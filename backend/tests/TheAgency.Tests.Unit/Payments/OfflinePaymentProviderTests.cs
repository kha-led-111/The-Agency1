using System;
using FluentAssertions;
using TheAgency.Application.Orders.Services;
using Xunit;

namespace TheAgency.Tests.Unit.Payments;

public class OfflinePaymentProviderTests
{
    [Fact]
    public void CalculateOrderFinancials_StandardPrice_ComputesCorrectFeeBreakdown()
    {
        // Item Price = 200.00
        // Fixed Delivery Fee = 30.00
        // Buyer Fee = 10% of 200.00 = 20.00
        // Seller Commission = 10% of 200.00 = 20.00
        // Delivery Cut = 15% of 30.00 = 4.50
        // Courier Earnings = 30.00 - 4.50 = 25.50
        // Net Seller Payout = 200.00 - 20.00 = 180.00
        // Total Payable By Buyer = 200.00 + 30.00 + 20.00 = 250.00

        var financials = CommissionFeeCalculator.CalculateOrderFinancials(200.00m);

        financials.ItemPrice.Should().Be(200.00m);
        financials.DeliveryFee.Should().Be(30.00m);
        financials.BuyerFee.Should().Be(20.00m);
        financials.SellerCommission.Should().Be(20.00m);
        financials.CourierEarnings.Should().Be(25.50m);
        financials.NetSellerPayout.Should().Be(180.00m);
        financials.TotalAmountPayableByBuyer.Should().Be(250.00m);
        financials.PlatformEarnings.Should().Be(44.50m); // 20 + 20 + 4.50
    }

    [Fact]
    public void CalculateReturnFinancials_StandardItem_DeductsFixedSellerReturnFee()
    {
        // Item Price = 200.00, Total Paid = 250.00
        // Fixed Return Fee = 20.00
        // Net Buyer Refund = 250.00 - 20.00 = 230.00

        var returnFinancials = CommissionFeeCalculator.CalculateReturnFinancials(200.00m, 250.00m);

        returnFinancials.FixedReturnFee.Should().Be(20.00m);
        returnFinancials.TotalReturnCost.Should().Be(20.00m);
        returnFinancials.NetBuyerRefund.Should().Be(230.00m);
    }
}
