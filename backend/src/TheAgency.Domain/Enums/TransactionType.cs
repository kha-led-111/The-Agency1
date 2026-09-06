using System.Text.Json.Serialization;

namespace TheAgency.Domain.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TransactionType
{
    PaymentCollection = 1,
    SellerPayout = 2,
    CourierFeePayout = 3,
    SellerReturnFeeDeduction = 4,
    PlatformCommission = 5
}
