using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FluentAssertions;
using TheAgency.Application.Identity.Common;
using TheAgency.Application.Marketplace.Common;
using TheAgency.Application.Orders.Common;

namespace TheAgency.Tests.Integration;

public class CODPaymentAndReturnTests : IClassFixture<AgencyWebApplicationFactory>
{
    private readonly AgencyWebApplicationFactory _factory;

    public CODPaymentAndReturnTests(AgencyWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<(HttpClient Client, AuthenticationResult Auth)> CreateAuthenticatedUserAsync(string emailPrefix = "coduser")
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
    public async Task CODCheckout_Settlement_And_ReturnFlow_ShouldSucceed()
    {
        var (sellerClient, _) = await CreateAuthenticatedUserAsync("codseller");
        var (buyerClient, _) = await CreateAuthenticatedUserAsync("codbuyer");

        // 1. Create Product
        var categories = (await (await sellerClient.GetAsync("/api/marketplace/categories")).Content.ReadFromJsonAsync<List<CategoryDto>>())!;
        var categoryId = categories[0].Id;

        var createProdResponse = await sellerClient.PostAsJsonAsync("/api/marketplace", new
        {
            categoryId = categoryId,
            title = $"COD Leather Jacket {Guid.NewGuid():N}",
            description = "High quality genuine leather jacket for autumn.",
            price = 200.00m,
            condition = "Excellent",
            imageUrl = "/uploads/test.jpg",
            imageUrls = new[] { "/uploads/test1.jpg", "/uploads/test2.jpg" },
            governorate = "الغربية",
            city = "طنطا"
        });
        createProdResponse.EnsureSuccessStatusCode();
        var product = (await createProdResponse.Content.ReadFromJsonAsync<ProductDto>())!;

        var adminClient = _factory.CreateClient();
        await adminClient.ApproveProductAsync(product.Id);

        // 2. Buyer Checkout COD
        var checkoutResponse = await buyerClient.PostAsJsonAsync("/api/orders", new
        {
            productIds = new[] { product.Id },
            shippingAddress = "شارع البحر، المحلة الكبرى، مصر"
        });
        checkoutResponse.EnsureSuccessStatusCode();
        var order = (await checkoutResponse.Content.ReadFromJsonAsync<OrderDto>())!;

        order.PaymentMethod.Should().Be("CashOnDelivery");
        order.ItemPrice.Should().Be(200.00m);
        order.DeliveryFee.Should().Be(30.00m);
        order.BuyerFee.Should().Be(20.00m);          // 10% of 200
        order.SellerCommission.Should().Be(20.00m);   // 10% of 200
        order.CourierEarnings.Should().Be(25.50m);    // 30 - 15%
        order.PlatformEarnings.Should().Be(44.50m);   // 20 + 20 + 4.50
        order.TotalAmount.Should().Be(250.00m);       // 200 + 30 + 20

        // 3. Settle COD Payment upon delivery
        var settleResponse = await buyerClient.PostAsync($"/api/orders/{order.Id}/settle-cod", null);
        settleResponse.EnsureSuccessStatusCode();
        var settledOrder = (await settleResponse.Content.ReadFromJsonAsync<OrderDto>())!;
        settledOrder.Status.Should().Be("Paid");

        // 4. Return Order Process
        var returnResponse = await buyerClient.PostAsync($"/api/orders/{order.Id}/return", null);
        returnResponse.EnsureSuccessStatusCode();
        var returnedOrder = (await returnResponse.Content.ReadFromJsonAsync<OrderDto>())!;

        returnedOrder.ReturnFee.Should().Be(20.00m);
        returnedOrder.Status.Should().Be("Returned");

        // Verify product restored back to Published
        var getProductResponse = await buyerClient.GetAsync($"/api/marketplace/{product.Slug}");
        getProductResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var restoredProd = await getProductResponse.Content.ReadFromJsonAsync<ProductDto>();
        restoredProd!.Status.Should().Be("Published");
    }
}
