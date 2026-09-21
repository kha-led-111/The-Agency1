using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using TheAgency.Application.Marketplace.Common;
using TheAgency.Application.Orders.Common;
using Xunit;

namespace TheAgency.Tests.Integration.Quality;

public sealed class CriticalE2EJourneyTests : IClassFixture<AgencyWebApplicationFactory>
{
    private readonly AgencyWebApplicationFactory _factory;

    public CriticalE2EJourneyTests(AgencyWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    [Trait("Category", "IntegrationE2E")]
    public async Task CompleteE2EUserJourney_FromListingToDeliveryAndNotificationAudit()
    {
        var client = _factory.CreateClient();

        // 1. Register Seller & Buyer
        var sellerEmail = $"seller_e2e_{Guid.NewGuid():N}@example.com";
        var buyerEmail = $"buyer_e2e_{Guid.NewGuid():N}@example.com";

        var sellerReg = await client.RegisterAsync(sellerEmail);
        sellerReg.StatusCode.Should().Be(HttpStatusCode.OK);
        var sellerJson = await sellerReg.Content.ReadFromJsonAsync<JsonElement>();
        var sellerToken = sellerJson.GetProperty("accessToken").GetString()!;

        var buyerReg = await client.RegisterAsync(buyerEmail);
        buyerReg.StatusCode.Should().Be(HttpStatusCode.OK);
        var buyerJson = await buyerReg.Content.ReadFromJsonAsync<JsonElement>();
        var buyerToken = buyerJson.GetProperty("accessToken").GetString()!;

        // Fetch categories to get valid CategoryId
        var categoriesResp = await client.GetAsync("/api/marketplace/categories");
        var categories = (await categoriesResp.Content.ReadFromJsonAsync<List<CategoryDto>>())!;
        var categoryId = categories[0].Id;

        // 2. Seller Creates Product Listing
        client.UseBearer(sellerToken);
        var createProductResp = await client.PostAsJsonAsync("/api/marketplace", new
        {
            categoryId = categoryId,
            title = "Vintage Mechanical Watch",
            description = "Rare 1970s watch in immaculate working condition and original box.",
            price = 400.0m,
            condition = "LikeNew",
            imageUrl = "/uploads/test.jpg"
        });
        createProductResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var product = (await createProductResp.Content.ReadFromJsonAsync<ProductDto>())!;
        var productId = product.Id;

        var adminClient = _factory.CreateClient();
        await adminClient.ApproveProductAsync(productId);

        // 3. Buyer Browses Marketplace & Locates Listing
        client.UseBearer(buyerToken);
        var browseResp = await client.GetAsync("/api/marketplace");
        browseResp.StatusCode.Should().Be(HttpStatusCode.OK);

        // 4. Buyer Places Checkout Order (Rule 8 Total Validation)
        var orderResp = await client.PostAsJsonAsync("/api/orders", new
        {
            productIds = new[] { productId },
            shippingAddress = "فيلا 99، شارع النحاس، طنطا"
        });
        orderResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var order = (await orderResp.Content.ReadFromJsonAsync<OrderDto>())!;
        
        // Expected: $400 item + $40 buyer fee (10%) + $30 delivery fee = $470
        order.TotalAmount.Should().Be(470.0m);

        // 5. Seller Settle COD
        client.UseBearer(sellerToken);
        var settleCodResp = await client.PostAsync($"/api/orders/{order.Id}/settle-cod", null);
        settleCodResp.StatusCode.Should().Be(HttpStatusCode.OK);

        // 6. Verify Notifications endpoint returns notifications
        client.UseBearer(buyerToken);
        var notifResp = await client.GetAsync("/api/notifications");
        notifResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var notifsJson = await notifResp.Content.ReadFromJsonAsync<JsonElement>();
        notifsJson.ValueKind.Should().Be(JsonValueKind.Array);
    }
}
