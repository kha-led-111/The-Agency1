using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FluentAssertions;
using TheAgency.Application.Delivery.Common;
using TheAgency.Application.Identity.Common;
using TheAgency.Application.Marketplace.Common;
using TheAgency.Application.Orders.Common;

namespace TheAgency.Tests.Integration;

public class DeliveryIntegrationTests : IClassFixture<AgencyWebApplicationFactory>
{
    private readonly AgencyWebApplicationFactory _factory;

    public DeliveryIntegrationTests(AgencyWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<(HttpClient Client, AuthenticationResult Auth)> CreateAuthenticatedUserAsync(string emailPrefix = "delivuser")
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
    public async Task DeliveryLifecycle_FullAssignment_StatusUpdates_And_TrackingLogs_ShouldSucceed()
    {
        var (sellerClient, _) = await CreateAuthenticatedUserAsync("delivseller");
        var (buyerClient, _) = await CreateAuthenticatedUserAsync("delivbuyer");
        var (courierClient, _) = await CreateAuthenticatedUserAsync("delivcourier");

        // 1. Onboard Courier Profile
        var onboardResponse = await courierClient.PostAsJsonAsync("/api/couriers/onboard", new
        {
            vehicleType = "Motorcycle",
            deliveryZone = "Cairo Central"
        });
        onboardResponse.EnsureSuccessStatusCode();
        var courierProfile = (await onboardResponse.Content.ReadFromJsonAsync<CourierProfileDto>())!;
        courierProfile.IsAvailable.Should().BeTrue();

        // 2. Seller creates product & Buyer checks out
        var categories = (await (await sellerClient.GetAsync("/api/marketplace/categories")).Content.ReadFromJsonAsync<List<CategoryDto>>())!;
        var categoryId = categories[0].Id;

        var createProdResponse = await sellerClient.PostAsJsonAsync("/api/marketplace", new
        {
            categoryId = categoryId,
            title = $"Delivery Flow Watch {Guid.NewGuid():N}",
            description = "Sleek wristwatch for delivery lifecycle testing.",
            price = 500.00m,
            condition = "New"
        });
        createProdResponse.EnsureSuccessStatusCode();
        var product = (await createProdResponse.Content.ReadFromJsonAsync<ProductDto>())!;

        var checkoutResponse = await buyerClient.PostAsJsonAsync("/api/orders", new
        {
            productIds = new[] { product.Id },
            shippingAddress = "شارع قناة السويس، المنصورة، مصر"
        });
        checkoutResponse.EnsureSuccessStatusCode();
        var order = (await checkoutResponse.Content.ReadFromJsonAsync<OrderDto>())!;

        // 3. Assign Courier to Delivery Task
        var assignResponse = await sellerClient.PostAsJsonAsync("/api/deliveries/assign", new
        {
            orderId = order.Id,
            courierId = courierProfile.UserId
        });
        assignResponse.EnsureSuccessStatusCode();
        var deliveryTask = (await assignResponse.Content.ReadFromJsonAsync<DeliveryTaskDto>())!;
        deliveryTask.Status.ToString().Should().Be("Assigned");

        // 4. Courier updates status -> PickedUp
        var pickupResponse = await courierClient.PatchAsJsonAsync($"/api/deliveries/{deliveryTask.Id}/status", new
        {
            status = "PickedUp",
            note = "Package picked up from seller."
        });
        pickupResponse.EnsureSuccessStatusCode();
        var pickedUpTask = (await pickupResponse.Content.ReadFromJsonAsync<DeliveryTaskDto>())!;
        pickedUpTask.Status.ToString().Should().Be("PickedUp");

        // 5. Courier updates status -> Delivered
        var deliveredResponse = await courierClient.PatchAsJsonAsync($"/api/deliveries/{deliveryTask.Id}/status", new
        {
            status = "Delivered",
            note = "Package delivered to buyer address."
        });
        deliveredResponse.EnsureSuccessStatusCode();
        var completedTask = (await deliveredResponse.Content.ReadFromJsonAsync<DeliveryTaskDto>())!;
        completedTask.Status.ToString().Should().Be("Delivered");

        // 6. Query Tracking Logs
        var trackingResponse = await buyerClient.GetAsync($"/api/deliveries/{deliveryTask.Id}/tracking");
        trackingResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var trackingEvents = (await trackingResponse.Content.ReadFromJsonAsync<List<DeliveryTrackingEventDto>>())!;
        trackingEvents.Should().HaveCountGreaterThanOrEqualTo(3);
    }
}
