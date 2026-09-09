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

public class OrderLifecycleIntegrationTests : IClassFixture<AgencyWebApplicationFactory>
{
    private readonly AgencyWebApplicationFactory _factory;

    public OrderLifecycleIntegrationTests(AgencyWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<(HttpClient Client, AuthenticationResult Auth)> CreateAuthenticatedUserAsync(string emailPrefix = "lifecycleuser")
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
    public async Task OrderStatus_StateTransitions_EnforcesStateMachineRules()
    {
        var (sellerClient, _) = await CreateAuthenticatedUserAsync("lifeseller");
        var (buyerClient, _) = await CreateAuthenticatedUserAsync("lifebuyer");

        // 1. Create Product
        var categories = (await (await sellerClient.GetAsync("/api/marketplace/categories")).Content.ReadFromJsonAsync<List<CategoryDto>>())!;
        var categoryId = categories[0].Id;

        var createProdResponse = await sellerClient.PostAsJsonAsync("/api/marketplace", new
        {
            categoryId = categoryId,
            title = $"Lifecycle Test Item {Guid.NewGuid():N}",
            description = "Test item for order state machine transitions.",
            price = 300.00m,
            condition = "LikeNew"
        });
        createProdResponse.EnsureSuccessStatusCode();
        var product = (await createProdResponse.Content.ReadFromJsonAsync<ProductDto>())!;

        // 2. Buyer Checkout -> PendingPayment
        var checkoutResponse = await buyerClient.PostAsJsonAsync("/api/orders", new
        {
            productIds = new[] { product.Id },
            shippingAddress = "شارع البحر، المحلة الكبرى، مصر"
        });
        checkoutResponse.EnsureSuccessStatusCode();
        var order = (await checkoutResponse.Content.ReadFromJsonAsync<OrderDto>())!;
        order.Status.Should().Be("PendingPayment");

        // 3. Settle Payment -> Paid
        var settleResponse = await buyerClient.PostAsync($"/api/orders/{order.Id}/settle-cod", null);
        settleResponse.EnsureSuccessStatusCode();
        var paidOrder = (await settleResponse.Content.ReadFromJsonAsync<OrderDto>())!;
        paidOrder.Status.Should().Be("Paid");

        // 4. Seller updates status Paid -> Processing
        var processingResponse = await sellerClient.PatchAsJsonAsync($"/api/orders/{order.Id}/status", new
        {
            status = "Processing"
        });
        processingResponse.EnsureSuccessStatusCode();
        var processingOrder = (await processingResponse.Content.ReadFromJsonAsync<OrderDto>())!;
        processingOrder.Status.Should().Be("Processing");

        // 5. Invalid transition: Buyer tries to jump Processing -> Delivered (should fail)
        var invalidResponse = await buyerClient.PatchAsJsonAsync($"/api/orders/{order.Id}/status", new
        {
            status = "Delivered"
        });
        invalidResponse.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.Unauthorized);

        // 6. Buyer requests return when delivered (Delivered -> ReturnRequested)
        // Seller can cancel processing order -> Cancelled
        var cancelResponse = await sellerClient.PatchAsJsonAsync($"/api/orders/{order.Id}/status", new
        {
            status = "Cancelled"
        });
        cancelResponse.EnsureSuccessStatusCode();
        var cancelledOrder = (await cancelResponse.Content.ReadFromJsonAsync<OrderDto>())!;
        cancelledOrder.Status.Should().Be("Cancelled");

        // Verify product restored back to Published
        var getProductResponse = await buyerClient.GetAsync($"/api/marketplace/{product.Slug}");
        getProductResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var restoredProd = await getProductResponse.Content.ReadFromJsonAsync<ProductDto>();
        restoredProd!.Status.Should().Be("Published");
    }
}
