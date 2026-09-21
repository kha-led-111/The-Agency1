using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Xunit;
using TheAgency.Application.Delivery.Common;
using TheAgency.Application.Identity.Common;
using TheAgency.Application.Marketplace.Common;
using TheAgency.Application.Orders.Common;

namespace TheAgency.Tests.Integration;

public class CourierAssignedOrdersIntegrationTests : IClassFixture<AgencyWebApplicationFactory>
{
    private readonly AgencyWebApplicationFactory _factory;

    public CourierAssignedOrdersIntegrationTests(AgencyWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<(HttpClient Client, AuthenticationResult Auth)> CreateAuthenticatedUserAsync(string emailPrefix = "couruser")
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
    public async Task CourierMyOrders_And_QuickStatusActionButtons_ShouldWorkAsExpected()
    {
        var (sellerClient, _) = await CreateAuthenticatedUserAsync("courseller");
        var (buyerClient, _) = await CreateAuthenticatedUserAsync("courbuyer");
        var (courierClient, courierAuth) = await CreateAuthenticatedUserAsync("couragent");

        // 1. Onboard Courier Profile
        var onboardResponse = await courierClient.PostAsJsonAsync("/api/couriers/onboard", new
        {
            vehicleType = "Motorcycle",
            deliveryZone = "Tanta Central"
        });
        onboardResponse.EnsureSuccessStatusCode();
        var courierProfile = (await onboardResponse.Content.ReadFromJsonAsync<CourierProfileDto>())!;

        // 2. Seller creates product & Buyer checks out
        var categories = (await (await sellerClient.GetAsync("/api/marketplace/categories")).Content.ReadFromJsonAsync<List<CategoryDto>>())!;
        var categoryId = categories[0].Id;

        var createProdResponse = await sellerClient.PostAsJsonAsync("/api/marketplace", new
        {
            categoryId = categoryId,
            title = $"Courier Test Item {Guid.NewGuid():N}",
            description = "High quality item for courier assigned orders test.",
            price = 300.00m,
            condition = "New",
            imageUrl = "/uploads/test.jpg"
        });
        createProdResponse.EnsureSuccessStatusCode();
        var product = (await createProdResponse.Content.ReadFromJsonAsync<ProductDto>())!;

        var adminClient = _factory.CreateClient();
        await adminClient.ApproveProductAsync(product.Id);

        var checkoutResponse = await buyerClient.PostAsJsonAsync("/api/orders", new
        {
            productIds = new[] { product.Id },
            shippingAddress = "شارع النحاس، طنطا، الغربية"
        });
        checkoutResponse.EnsureSuccessStatusCode();
        var order = (await checkoutResponse.Content.ReadFromJsonAsync<OrderDto>())!;

        // 3. Assign Courier to Delivery
        var assignResponse = await sellerClient.PostAsJsonAsync("/api/deliveries/assign", new
        {
            orderId = order.Id,
            courierId = courierProfile.UserId
        });
        assignResponse.EnsureSuccessStatusCode();

        // 4. Query GET /api/courier/my-orders & GET /api/courier/orders/assigned as Courier
        var assignedResponse = await courierClient.GetAsync("/api/courier/orders/assigned");
        assignedResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var assignedOrders = (await assignedResponse.Content.ReadFromJsonAsync<List<OrderDto>>())!;

        var myOrdersResponse = await courierClient.GetAsync("/api/courier/my-orders");
        myOrdersResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        assignedOrders.Should().NotBeNull();
        assignedOrders.Should().Contain(o => o.Id == order.Id);

        var fetchedOrder = assignedOrders.Find(o => o.Id == order.Id)!;
        fetchedOrder.Buyer.Should().NotBeNull();
        fetchedOrder.ShippingAddress.Should().Be("شارع النحاس، طنطا، الغربية");

        // 5. Courier updates status -> Delivered ("تم التوصيل")
        var confirmDeliveryResponse = await courierClient.PatchAsJsonAsync($"/api/orders/{order.Id}/status", new
        {
            status = "Delivered"
        });
        confirmDeliveryResponse.EnsureSuccessStatusCode();
        var deliveredOrder = (await confirmDeliveryResponse.Content.ReadFromJsonAsync<OrderDto>())!;
        deliveredOrder.Status.Should().Be("Delivered");

        // 6. Test Mark as Returned ("تم الإرجاع / مرتجع") on a second order
        var createProd2Response = await sellerClient.PostAsJsonAsync("/api/marketplace", new
        {
            categoryId = categoryId,
            title = $"Courier Return Item {Guid.NewGuid():N}",
            description = "Item for testing return fee deduction flow.",
            price = 400.00m,
            condition = "New",
            imageUrl = "/uploads/test2.jpg"
        });
        createProd2Response.EnsureSuccessStatusCode();
        var product2 = (await createProd2Response.Content.ReadFromJsonAsync<ProductDto>())!;
        await adminClient.ApproveProductAsync(product2.Id);

        var checkout2Response = await buyerClient.PostAsJsonAsync("/api/orders", new
        {
            productIds = new[] { product2.Id },
            shippingAddress = "شارع البحر، المحلة الكبرى، مصر"
        });
        checkout2Response.EnsureSuccessStatusCode();
        var order2 = (await checkout2Response.Content.ReadFromJsonAsync<OrderDto>())!;

        await sellerClient.PostAsJsonAsync("/api/deliveries/assign", new
        {
            orderId = order2.Id,
            courierId = courierProfile.UserId
        });

        var returnResponse = await courierClient.PatchAsJsonAsync($"/api/orders/{order2.Id}/status", new
        {
            status = "Returned"
        });
        returnResponse.EnsureSuccessStatusCode();
        var returnedOrder = (await returnResponse.Content.ReadFromJsonAsync<OrderDto>())!;
        returnedOrder.Status.Should().Be("Returned");
        returnedOrder.ReturnFee.Should().Be(20.00m);
    }
}
