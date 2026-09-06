using System;

namespace TheAgency.Application.Orders.Services;

public sealed record OrderFinancials(
    decimal ItemPrice,
    decimal DeliveryFee,
    decimal BuyerFee,
    decimal SellerCommission,
    decimal NetSellerPayout,
    decimal CourierEarnings,
    decimal PlatformEarnings,
    decimal TotalAmountPayableByBuyer
);

public sealed record ReturnFinancials(
    decimal FixedReturnFee,
    decimal ReturnPercentageFee,
    decimal TotalReturnCost,
    decimal NetBuyerRefund,
    decimal PlatformReturnEarnings
);

public static class CommissionFeeCalculator
{
    public const decimal DefaultFixedDeliveryFee = 30.00m;      // 30 EGP
    public const decimal DefaultBuyerFeeRate = 0.10m;          // 10%
    public const decimal DefaultSellerCommissionRate = 0.10m;  // 10%
    public const decimal DefaultDeliveryCutRate = 0.15m;       // 15% platform cut from delivery fee

    public const decimal DefaultFixedReturnFee = 20.00m;        // 20 EGP per party
    public const decimal DefaultReturnPercentageFeeRate = 0.00m; // Fixed 20 EGP return fee per party

    public static OrderFinancials CalculateOrderFinancials(
        decimal itemPrice,
        decimal fixedDeliveryFee = DefaultFixedDeliveryFee,
        decimal buyerFeeRate = DefaultBuyerFeeRate,
        decimal sellerCommissionRate = DefaultSellerCommissionRate,
        decimal deliveryCutRate = DefaultDeliveryCutRate)
    {
        var buyerFee = Math.Round(itemPrice * buyerFeeRate, 2, MidpointRounding.AwayFromZero);
        var sellerCommission = Math.Round(itemPrice * sellerCommissionRate, 2, MidpointRounding.AwayFromZero);
        var platformDeliveryCut = Math.Round(fixedDeliveryFee * deliveryCutRate, 2, MidpointRounding.AwayFromZero);

        var courierEarnings = fixedDeliveryFee - platformDeliveryCut;
        var netSellerPayout = itemPrice - sellerCommission;
        var platformEarnings = buyerFee + sellerCommission + platformDeliveryCut;
        var totalAmountPayableByBuyer = itemPrice + fixedDeliveryFee + buyerFee;

        return new OrderFinancials(
            ItemPrice: itemPrice,
            DeliveryFee: fixedDeliveryFee,
            BuyerFee: buyerFee,
            SellerCommission: sellerCommission,
            NetSellerPayout: netSellerPayout,
            CourierEarnings: courierEarnings,
            PlatformEarnings: platformEarnings,
            TotalAmountPayableByBuyer: totalAmountPayableByBuyer
        );
    }

    public static ReturnFinancials CalculateReturnFinancials(
        decimal itemPrice,
        decimal totalAmountPaid,
        decimal fixedReturnFee = DefaultFixedReturnFee,
        decimal returnPercentageRate = DefaultReturnPercentageFeeRate)
    {
        var returnPercentageFee = Math.Round(itemPrice * returnPercentageRate, 2, MidpointRounding.AwayFromZero);
        var totalReturnCost = fixedReturnFee + returnPercentageFee;
        var netBuyerRefund = Math.Max(0m, totalAmountPaid - totalReturnCost);
        var platformReturnEarnings = totalReturnCost;

        return new ReturnFinancials(
            FixedReturnFee: fixedReturnFee,
            ReturnPercentageFee: returnPercentageFee,
            TotalReturnCost: totalReturnCost,
            NetBuyerRefund: netBuyerRefund,
            PlatformReturnEarnings: platformReturnEarnings
        );
    }
}
