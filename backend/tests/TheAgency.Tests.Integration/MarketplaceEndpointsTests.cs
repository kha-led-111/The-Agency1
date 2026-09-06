using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using TheAgency.Application.Common.Models;
using TheAgency.Application.Identity.Common;
using TheAgency.Application.Marketplace.Common;

namespace TheAgency.Tests.Integration;

public class MarketplaceEndpointsTests : IClassFixture<AgencyWebApplicationFactory>
{
    private readonly AgencyWebApplicationFactory _factory;

    public MarketplaceEndpointsTests(AgencyWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<(HttpClient Client, AuthenticationResult Auth)> CreateAuthenticatedUserAsync(string emailPrefix = "mktuser")
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
    public async Task GetCategories_ShouldReturnSeededCategories()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/marketplace/categories");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var categories = await response.Content.ReadFromJsonAsync<List<CategoryDto>>();
        categories.Should().NotBeNull();
        categories.Should().Contain(c => c.Slug == "electronics");
        categories.Should().Contain(c => c.Slug == "fashion");
    }

    [Fact]
    public async Task CreateProduct_And_GetBySlug_ShouldSucceed()
    {
        var (client, _) = await CreateAuthenticatedUserAsync("seller");

        // Get categories first
        var categoriesResponse = await client.GetAsync("/api/marketplace/categories");
        var categories = (await categoriesResponse.Content.ReadFromJsonAsync<List<CategoryDto>>())!;
        var categoryId = categories[0].Id;

        var createResponse = await client.PostAsJsonAsync("/api/marketplace", new
        {
            categoryId = categoryId,
            title = $"Smart Watch {Guid.NewGuid():N}",
            description = "Brand new fitness smartwatch with OLED screen.",
            price = 199.99m,
            condition = "LikeNew",
            imageUrl = "https://example.com/watch.jpg"
        });

        createResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var product = await createResponse.Content.ReadFromJsonAsync<ProductDto>();
        product.Should().NotBeNull();
        product!.Title.Should().StartWith("Smart Watch");
        product.Price.Should().Be(199.99m);

        var getBySlugResponse = await client.GetAsync($"/api/marketplace/{product.Slug}");
        getBySlugResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var fetched = await getBySlugResponse.Content.ReadFromJsonAsync<ProductDto>();
        fetched!.Id.Should().Be(product.Id);
    }

    [Fact]
    public async Task UpdateProduct_ByAnotherSeller_ShouldBeRejected()
    {
        var (sellerClient, _) = await CreateAuthenticatedUserAsync("seller1");
        var (attackerClient, _) = await CreateAuthenticatedUserAsync("attacker");

        var categories = (await (await sellerClient.GetAsync("/api/marketplace/categories")).Content.ReadFromJsonAsync<List<CategoryDto>>())!;
        var categoryId = categories[0].Id;

        var createResponse = await sellerClient.PostAsJsonAsync("/api/marketplace", new
        {
            categoryId = categoryId,
            title = $"Original Item {Guid.NewGuid():N}",
            description = "Original seller item",
            price = 100m,
            condition = "New"
        });
        var product = (await createResponse.Content.ReadFromJsonAsync<ProductDto>())!;

        // Attacker attempts to modify seller1's product
        var updateResponse = await attackerClient.PutAsJsonAsync($"/api/marketplace/{product.Id}", new
        {
            title = "Hacked Title",
            price = 1m
        });

        // Handler throws UnauthorizedException which maps to Unauthorized (401) or Forbidden (403) or Custom ProblemDetails
        updateResponse.IsSuccessStatusCode.Should().BeFalse();
    }

    [Fact]
    public async Task AddAndGetFavorites_ShouldManageBuyerBookmarks()
    {
        var (sellerClient, _) = await CreateAuthenticatedUserAsync("favseller");
        var (buyerClient, _) = await CreateAuthenticatedUserAsync("favbuyer");

        var categories = (await (await sellerClient.GetAsync("/api/marketplace/categories")).Content.ReadFromJsonAsync<List<CategoryDto>>())!;
        var categoryId = categories[0].Id;

        var createResponse = await sellerClient.PostAsJsonAsync("/api/marketplace", new
        {
            categoryId = categoryId,
            title = $"Bookmarked Item {Guid.NewGuid():N}",
            description = "Item to favorite in marketplace test suite",
            price = 50m,
            condition = "Good"
        });
        createResponse.EnsureSuccessStatusCode();
        var product = (await createResponse.Content.ReadFromJsonAsync<ProductDto>())!;

        // Add to favorite
        var addFavResponse = await buyerClient.PostAsync($"/api/marketplace/{product.Id}/favorite", null);
        addFavResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Get favorites
        var getFavsResponse = await buyerClient.GetAsync("/api/marketplace/favorites");
        getFavsResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var favs = await getFavsResponse.Content.ReadFromJsonAsync<List<ProductDto>>();
        favs.Should().Contain(p => p.Id == product.Id);

        // Remove favorite
        var removeFavResponse = await buyerClient.DeleteAsync($"/api/marketplace/{product.Id}/favorite");
        removeFavResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
