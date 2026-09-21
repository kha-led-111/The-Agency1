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
            condition = "LikeNew",
            imageUrl = "/uploads/test.jpg"
        });
        createProdResponse.EnsureSuccessStatusCode();
        var product = (await createProdResponse.Content.ReadFromJsonAsync<ProductDto>())!;

        var adminClient = _factory.CreateClient();
        var adminLogin = await adminClient.PostAsJsonAsync("/api/auth/login", new
        {
            email = "khaledgmal644@gmail.com",
            password = "Admin123!"
        });
        adminLogin.StatusCode.Should().Be(HttpStatusCode.OK);
        var adminAuth = (await adminLogin.Content.ReadFromJsonAsync<AuthenticationResult>())!;
        adminClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminAuth.AccessToken);

        await adminClient.ApproveProductAsync(product.Id);

        // 2. Buyer Checkout -> PendingAdminReview
        var checkoutResponse = await buyerClient.PostAsJsonAsync("/api/orders", new
        {
            productIds = new[] { product.Id },
            shippingAddress = "شارع البحر، المحلة الكبرى، مصر"
        });
        checkoutResponse.EnsureSuccessStatusCode();
        var order = (await checkoutResponse.Content.ReadFromJsonAsync<OrderDto>())!;
        order.Status.Should().Be("PendingAdminReview");

        // 3. Admin assigns delivery agent -> AssignedToDelivery
        var (_, courierAuth) = await CreateAuthenticatedUserAsync("lifecourier");

        var assignResponse = await adminClient.PostAsJsonAsync($"/api/admin/orders/{order.Id}/assign-delivery", new
        {
            deliveryAgentId = courierAuth.User.Id,
            notes = "Test assignment"
        });
        assignResponse.EnsureSuccessStatusCode();
        var assignedOrder = (await assignResponse.Content.ReadFromJsonAsync<OrderDto>())!;
        assignedOrder.Status.Should().Be("AssignedToDelivery");

        // 4. Invalid transition: Buyer tries to jump Processing -> Delivered (should fail)
        var invalidResponse = await buyerClient.PatchAsJsonAsync($"/api/orders/{order.Id}/status", new
        {
            status = "Delivered"
        });
        invalidResponse.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.Unauthorized);

        // 5. Seller can cancel processing order -> Cancelled
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
