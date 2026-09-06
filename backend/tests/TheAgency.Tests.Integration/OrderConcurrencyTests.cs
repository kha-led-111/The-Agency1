using System;
using System.Collections.Concurrent;
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

namespace TheAgency.Tests.Integration;

public class OrderConcurrencyTests : IClassFixture<AgencyWebApplicationFactory>
{
    private readonly AgencyWebApplicationFactory _factory;

    public OrderConcurrencyTests(AgencyWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<(HttpClient Client, AuthenticationResult Auth)> CreateAuthenticatedUserAsync(string emailPrefix = "orderuser")
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
    public async Task Checkout_ConcurrentBuyers_Rule9_ExactlyOneBuyerSucceeds()
    {
        // 1. Setup seller and 10 concurrent buyers
        var (sellerClient, _) = await CreateAuthenticatedUserAsync("conc-seller");

        var buyerTasks = new List<Task<(HttpClient Client, AuthenticationResult Auth)>>();
        for (int i = 0; i < 10; i++)
        {
            buyerTasks.Add(CreateAuthenticatedUserAsync($"conc-buyer-{i}"));
        }
        var buyers = await Task.WhenAll(buyerTasks);

        // 2. Seller creates 1 unique product listing
        var categories = (await (await sellerClient.GetAsync("/api/marketplace/categories")).Content.ReadFromJsonAsync<List<CategoryDto>>())!;
        var categoryId = categories[0].Id;

        var createResponse = await sellerClient.PostAsJsonAsync("/api/marketplace", new
        {
            categoryId = categoryId,
            title = $"Exclusive Rare Item {Guid.NewGuid():N}",
            description = "Only one copy available in marketplace inventory.",
            price = 500.00m,
            condition = "LikeNew"
        });
        createResponse.EnsureSuccessStatusCode();
        var product = (await createResponse.Content.ReadFromJsonAsync<ProductDto>())!;

        // 3. Rule 9 Concurrency Protection Gate: Launch 10 parallel checkout requests simultaneously
        var responses = new ConcurrentBag<HttpResponseMessage>();

        var checkoutTasks = buyers.Select(buyer => Task.Run(async () =>
        {
            var response = await buyer.Client.PostAsJsonAsync("/api/orders", new
            {
                productIds = new[] { product.Id },
                shippingAddress = "456 Parallel St, Cairo, Egypt"
            });
            responses.Add(response);
        }));

        await Task.WhenAll(checkoutTasks);

        // 4. Assertions (Rule 9 Gate)
        var responseList = responses.ToList();
        var successResponses = responseList.Where(r => r.StatusCode == HttpStatusCode.OK).ToList();
        var conflictResponses = responseList.Where(r => r.StatusCode is HttpStatusCode.Conflict or HttpStatusCode.BadRequest).ToList();

        // Exactly one buyer must successfully purchase the single product
        successResponses.Should().HaveCount(1, because: "Rule 9 mandates that the same product must NEVER be sold twice");
        conflictResponses.Should().HaveCount(9, because: "All other concurrent attempts must be rejected with Conflict");

        var winningOrder = await successResponses[0].Content.ReadFromJsonAsync<OrderDto>();
        winningOrder.Should().NotBeNull();
        winningOrder!.TotalAmount.Should().Be(580.00m, because: "Rule 8 mandates server-authoritative 500 item + 30 delivery fee + 50 buyer fee");
    }
}
