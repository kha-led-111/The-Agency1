using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FluentAssertions;
using TheAgency.Application.Identity.Common;
using TheAgency.Application.Marketplace.Common;
using TheAgency.Application.Orders.Common;
using TheAgency.Application.Payments.Common;
using TheAgency.Domain.Enums;

namespace TheAgency.Tests.Integration;

public class OfflinePaymentIntegrationTests : IClassFixture<AgencyWebApplicationFactory>
{
    private readonly AgencyWebApplicationFactory _factory;

    public OfflinePaymentIntegrationTests(AgencyWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<(HttpClient Client, AuthenticationResult Auth)> CreateAuthenticatedUserAsync(string emailPrefix = "payuser")
    {
        var client = _factory.CreateClient();
        var email = $"{emailPrefix}-{Guid.NewGuid():N}@example.com";
        var response = await client.RegisterAsync(email);
        response.EnsureSuccessStatusCode();
        var auth = (await response.Content.ReadFromJsonAsync<AuthenticationResult>())!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);
        return (client, auth);
    }

    [Fact]
    public async Task OfflinePaymentSettlement_And_LedgerAccount_ShouldSucceed()
    {
        var (sellerClient, _) = await CreateAuthenticatedUserAsync("payseller");
        var (buyerClient, _) = await CreateAuthenticatedUserAsync("paybuyer");
        var (courierClient, _) = await CreateAuthenticatedUserAsync("paycourier");

        // 1. Seller creates product
        var categories = (await (await sellerClient.GetAsync("/api/marketplace/categories")).Content.ReadFromJsonAsync<List<CategoryDto>>())!;
        var categoryId = categories[0].Id;

        var createProdResponse = await sellerClient.PostAsJsonAsync("/api/marketplace", new
        {
            categoryId = categoryId,
            title = $"Offline Payment Test Item {Guid.NewGuid():N}",
            description = "Item to test offline COD settlement and ledger integration.",
            price = 400.00m,
            condition = "New"
        });
        createProdResponse.EnsureSuccessStatusCode();
        var product = (await createProdResponse.Content.ReadFromJsonAsync<ProductDto>())!;

        // 2. Buyer Checkout -> Order created
        var checkoutResponse = await buyerClient.PostAsJsonAsync("/api/orders", new
        {
            productIds = new[] { product.Id },
            shippingAddress = "شارع النحاس، طنطا، مصر"
        });
        checkoutResponse.EnsureSuccessStatusCode();
        var order = (await checkoutResponse.Content.ReadFromJsonAsync<OrderDto>())!;
        // TotalAmount = 400 item + 30 delivery fee + 40 buyer fee = 470.00m

        // 3. Courier settles COD offline collection
        var settleResponse = await courierClient.PostAsync($"/api/orders/{order.Id}/settle-cod", null);
        settleResponse.EnsureSuccessStatusCode();
        var settledOrder = (await settleResponse.Content.ReadFromJsonAsync<OrderDto>())!;
        settledOrder.Status.Should().Be("Paid");

        // 4. Query Courier Ledger & Transactions
        var courierLedgerResponse = await courierClient.GetAsync("/api/payments/my-ledger");
        courierLedgerResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var courierLedger = (await courierLedgerResponse.Content.ReadFromJsonAsync<UserLedgerDto>())!;
        courierLedger.PendingCashHeld.Should().Be(470.00m);
        courierLedger.AvailableBalance.Should().Be(25.50m); // 30 - 15% platform cut

        var courierTxResponse = await courierClient.GetAsync("/api/payments/transactions");
        courierTxResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var courierTxs = (await courierTxResponse.Content.ReadFromJsonAsync<List<PaymentTransactionDto>>())!;
        courierTxs.Should().NotBeEmpty();
        courierTxs.Any(t => t.Type == TransactionType.PaymentCollection).Should().BeTrue();

        // 5. Query Seller Ledger
        var sellerLedgerResponse = await sellerClient.GetAsync("/api/payments/my-ledger");
        sellerLedgerResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var sellerLedger = (await sellerLedgerResponse.Content.ReadFromJsonAsync<UserLedgerDto>())!;
        sellerLedger.AvailableBalance.Should().Be(360.00m); // 400 - 10% commission (40)

        // 6. Process Return -> Seller pays fixed return fee
        var returnResponse = await buyerClient.PostAsync($"/api/orders/{order.Id}/return", null);
        returnResponse.EnsureSuccessStatusCode();

        // 7. Verify Seller Return Fee Deduction
        var updatedSellerLedgerResponse = await sellerClient.GetAsync("/api/payments/my-ledger");
        var updatedSellerLedger = (await updatedSellerLedgerResponse.Content.ReadFromJsonAsync<UserLedgerDto>())!;
        updatedSellerLedger.AvailableBalance.Should().Be(340.00m); // 360 - 20.00 fixed return fee
        updatedSellerLedger.TotalFeesPaid.Should().Be(60.00m);    // 40 commission + 20 return fee
    }
}
