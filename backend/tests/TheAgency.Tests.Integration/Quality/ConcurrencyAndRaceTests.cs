using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using TheAgency.Application.Marketplace.Common;
using TheAgency.Application.Orders.Common;
using Xunit;

namespace TheAgency.Tests.Integration.Quality;

public sealed class ConcurrencyAndRaceTests : IClassFixture<AgencyWebApplicationFactory>
{
    private readonly AgencyWebApplicationFactory _factory;

    public ConcurrencyAndRaceTests(AgencyWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    [Trait("Category", "IntegrationConcurrency")]
    public async Task DoubleBuyPreventionGate_15ConcurrentBuyers_ExactlyOneSucceeds()
    {
        var client = _factory.CreateClient();

        // 1. Seller creates listing
        var sellerEmail = $"seller_race_{Guid.NewGuid():N}@example.com";
        var sellerReg = await client.RegisterAsync(sellerEmail);
        var sellerAuth = (await sellerReg.Content.ReadFromJsonAsync<Application.Identity.Common.AuthenticationResult>())!;
        client.UseBearer(sellerAuth.AccessToken);

        var categoriesResp = await client.GetAsync("/api/marketplace/categories");
        var categories = (await categoriesResp.Content.ReadFromJsonAsync<List<CategoryDto>>())!;
        var categoryId = categories[0].Id;

        var createProdResp = await client.PostAsJsonAsync("/api/marketplace", new
        {
            categoryId = categoryId,
            title = "Exclusive Collector Watch",
            description = "One-of-a-kind timepiece available in marketplace.",
            price = 1000.0m,
            condition = "LikeNew"
        });
        createProdResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var product = (await createProdResp.Content.ReadFromJsonAsync<ProductDto>())!;

        // 2. Prepare 15 distinct buyer clients
        var concurrentBuyersCount = 15;
        var buyerClients = new HttpClient[concurrentBuyersCount];
        for (int i = 0; i < concurrentBuyersCount; i++)
        {
            var bClient = _factory.CreateClient();
            var bReg = await bClient.RegisterAsync($"buyer_race_{i}_{Guid.NewGuid():N}@example.com");
            var bAuth = (await bReg.Content.ReadFromJsonAsync<Application.Identity.Common.AuthenticationResult>())!;
            bClient.UseBearer(bAuth.AccessToken);
            buyerClients[i] = bClient;
        }

        // 3. Fire all 15 checkout order requests simultaneously
        var tasks = buyerClients.Select(bClient => bClient.PostAsJsonAsync("/api/orders", new
        {
            productIds = new[] { product.Id },
            shippingAddress = "Dubai Marina Tower 1"
        })).ToArray();

        var responses = await Task.WhenAll(tasks);

        // 4. Invariant Assertion: Rule 9 Double-Buy Prevention Gate
        var successCount = responses.Count(r => r.StatusCode == HttpStatusCode.OK);
        var failedCount = responses.Count(r => r.StatusCode is HttpStatusCode.BadRequest or HttpStatusCode.Conflict);

        successCount.Should().Be(1, "The same product must never be successfully sold twice under concurrent load.");
        failedCount.Should().Be(concurrentBuyersCount - 1);
    }

    [Fact]
    [Trait("Category", "IntegrationIdempotency")]
    public async Task IdempotencyKey_RepeatedRequest_ReturnsIdenticalOrderWithoutDuplication()
    {
        var client = _factory.CreateClient();
        var sellerReg = await client.RegisterAsync($"seller_idem_{Guid.NewGuid():N}@example.com");
        var sellerAuth = (await sellerReg.Content.ReadFromJsonAsync<Application.Identity.Common.AuthenticationResult>())!;
        client.UseBearer(sellerAuth.AccessToken);

        var categoriesResp = await client.GetAsync("/api/marketplace/categories");
        var categories = (await categoriesResp.Content.ReadFromJsonAsync<List<CategoryDto>>())!;
        var categoryId = categories[0].Id;

        var createProdResp = await client.PostAsJsonAsync("/api/marketplace", new
        {
            categoryId = categoryId,
            title = "Idempotency Test Item",
            description = "Unique item description for idempotency testing.",
            price = 150.0m,
            condition = "New"
        });
        createProdResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var product = (await createProdResp.Content.ReadFromJsonAsync<ProductDto>())!;

        var buyerReg = await client.RegisterAsync($"buyer_idem_{Guid.NewGuid():N}@example.com");
        var buyerAuth = (await buyerReg.Content.ReadFromJsonAsync<Application.Identity.Common.AuthenticationResult>())!;
        client.UseBearer(buyerAuth.AccessToken);

        var idempotencyKey = Guid.NewGuid().ToString();
        var requestMessage1 = new HttpRequestMessage(HttpMethod.Post, "/api/orders")
        {
            Content = JsonContent.Create(new
            {
                productIds = new[] { product.Id },
                shippingAddress = "Downtown Dubai"
            })
        };
        requestMessage1.Headers.Add("Idempotency-Key", idempotencyKey);

        // Send First Request
        var resp1 = await client.SendAsync(requestMessage1);
        resp1.StatusCode.Should().Be(HttpStatusCode.OK);
        var order1 = (await resp1.Content.ReadFromJsonAsync<OrderDto>())!;

        // Send Second Request with same Idempotency-Key (simulating network retry)
        var requestMessage2 = new HttpRequestMessage(HttpMethod.Post, "/api/orders")
        {
            Content = JsonContent.Create(new
            {
                productIds = new[] { product.Id },
                shippingAddress = "Downtown Dubai"
            })
        };
        requestMessage2.Headers.Add("Idempotency-Key", idempotencyKey);

        var resp2 = await client.SendAsync(requestMessage2);
        resp2.StatusCode.Should().Be(HttpStatusCode.OK);
        var order2 = (await resp2.Content.ReadFromJsonAsync<OrderDto>())!;

        // Assert: Same order returned without creating a duplicate or throwing error
        order2.Id.Should().Be(order1.Id);
    }
}
