using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using TheAgency.Application.Identity.Common;
using TheAgency.Application.Marketplace.Common;
using Xunit;

namespace TheAgency.Tests.Integration.Quality;

public sealed class SecurityRegressionTests : IClassFixture<AgencyWebApplicationFactory>
{
    private readonly AgencyWebApplicationFactory _factory;

    public SecurityRegressionTests(AgencyWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    [Trait("Category", "SecurityIntegration")]
    public async Task BolaIdor_NonSellerAttemptToDeleteProduct_ReturnsForbidden()
    {
        var client = _factory.CreateClient();

        // 1. Seller registers and creates a product
        var sellerReg = await client.RegisterAsync($"seller_sec_{Guid.NewGuid():N}@example.com");
        var sellerAuth = (await sellerReg.Content.ReadFromJsonAsync<AuthenticationResult>())!;
        client.UseBearer(sellerAuth.AccessToken);

        var categoriesResp = await client.GetAsync("/api/marketplace/categories");
        var categories = (await categoriesResp.Content.ReadFromJsonAsync<List<CategoryDto>>())!;
        var categoryId = categories[0].Id;

        var createProdResp = await client.PostAsJsonAsync("/api/marketplace", new
        {
            categoryId = categoryId,
            title = "Protected Item",
            description = "Only authorized owner can delete this product listing.",
            price = 50.0m,
            condition = "Good",
            imageUrl = "/uploads/test.jpg"
        });
        createProdResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var product = (await createProdResp.Content.ReadFromJsonAsync<ProductDto>())!;

        // 2. Attacker registers
        var attackerReg = await client.RegisterAsync($"attacker_sec_{Guid.NewGuid():N}@example.com");
        var attackerAuth = (await attackerReg.Content.ReadFromJsonAsync<AuthenticationResult>())!;
        client.UseBearer(attackerAuth.AccessToken);

        // 3. Attacker attempts to delete Seller's product (BOLA / IDOR attack)
        var deleteResp = await client.DeleteAsync($"/api/marketplace/{product.Id}");

        // Assert: Access Denied (403 Forbidden / Unauthorized / BadRequest)
        deleteResp.StatusCode.Should().BeOneOf(HttpStatusCode.Forbidden, HttpStatusCode.Unauthorized, HttpStatusCode.BadRequest);
    }

    [Fact]
    [Trait("Category", "SecurityIntegration")]
    public async Task Rule11_FileUpload_ExecutablePayload_RejectedByMagicBytesValidation()
    {
        var client = _factory.CreateClient();
        var userReg = await client.RegisterAsync($"uploader_{Guid.NewGuid():N}@example.com");
        var auth = (await userReg.Content.ReadFromJsonAsync<AuthenticationResult>())!;
        client.UseBearer(auth.AccessToken);

        // Fake executable payload pretending to be a JPG extension
        var fakeExeBytes = new byte[] { 0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00 }; // 'MZ' DOS header
        using var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(fakeExeBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        content.Add(fileContent, "file", "malicious_script.jpg");

        var uploadResp = await client.PostAsync("/api/marketplace/upload-image", content);

        // Assert: Rejected due to invalid image magic bytes header (Rule 11)
        uploadResp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    [Trait("Category", "SecurityIntegration")]
    public async Task Rule11_FileUpload_InvalidMimeType_RejectedWithBadRequest()
    {
        var client = _factory.CreateClient();
        var userReg = await client.RegisterAsync($"uploader_mime_{Guid.NewGuid():N}@example.com");
        var auth = (await userReg.Content.ReadFromJsonAsync<AuthenticationResult>())!;
        client.UseBearer(auth.AccessToken);

        byte[] pngHeader = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
        using var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(pngHeader);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
        content.Add(fileContent, "file", "sample.png");

        var uploadResp = await client.PostAsync("/api/marketplace/upload-image", content);
        uploadResp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    [Trait("Category", "SecurityIntegration")]
    public async Task Rule11_FileUpload_InvalidExtension_RejectedWithBadRequest()
    {
        var client = _factory.CreateClient();
        var userReg = await client.RegisterAsync($"uploader_ext_{Guid.NewGuid():N}@example.com");
        var auth = (await userReg.Content.ReadFromJsonAsync<AuthenticationResult>())!;
        client.UseBearer(auth.AccessToken);

        byte[] pngHeader = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
        using var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(pngHeader);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        content.Add(fileContent, "file", "sample.txt");

        var uploadResp = await client.PostAsync("/api/marketplace/upload-image", content);
        uploadResp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    [Trait("Category", "SecurityIntegration")]
    public async Task UnauthenticatedAccess_ToProtectedEndpoints_ReturnsUnauthorized()
    {
        var unauthClient = _factory.CreateClient(); // No bearer token header

        var ordersResp = await unauthClient.GetAsync("/api/orders/buyer");
        ordersResp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var ledgerResp = await unauthClient.GetAsync("/api/payments/my-ledger");
        ledgerResp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
