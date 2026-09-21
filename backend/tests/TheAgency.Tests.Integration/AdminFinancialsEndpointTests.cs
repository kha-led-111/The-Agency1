using System;
using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using TheAgency.Application.Admin.Common;
using TheAgency.Application.Identity.Common;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;
using TheAgency.Infrastructure.Persistence;
using Xunit;

namespace TheAgency.Tests.Integration;

public class AdminFinancialsEndpointTests : IClassFixture<AgencyWebApplicationFactory>
{
    private readonly AgencyWebApplicationFactory _factory;

    public AdminFinancialsEndpointTests(AgencyWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetFinancialSummary_WithoutToken_ShouldReturnUnauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/admin/financials/summary");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetFinancialSummary_AsBuyer_ShouldReturnForbidden()
    {
        var client = _factory.CreateClient();
        var buyerEmail = $"buyer-fin-{Guid.NewGuid():N}@example.com";
        var regResp = await client.RegisterAsync(buyerEmail);
        regResp.StatusCode.Should().Be(HttpStatusCode.OK);

        var regAuth = (await regResp.Content.ReadFromJsonAsync<AuthenticationResult>())!;
        client.UseBearer(regAuth.AccessToken);

        var response = await client.GetAsync("/api/admin/financials/summary");
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetFinancialSummary_AsAdmin_ShouldReturnOkWithSummaryData()
    {
        var client = _factory.CreateClient();

        // Seed a delivered order directly in db
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var deliveredOrder = new Order
            {
                Id = Guid.NewGuid(),
                OrderNumber = $"ORD-FIN-{Guid.NewGuid():N}",
                BuyerId = Guid.NewGuid(),
                ItemPrice = 1000.00m,
                DeliveryFee = 30.00m,
                BuyerFee = 100.00m,
                SellerCommission = 100.00m,
                CourierEarnings = 25.50m,
                PlatformEarnings = 204.50m,
                TotalAmount = 1130.00m,
                Status = OrderStatus.Delivered
            };
            db.Orders.Add(deliveredOrder);
            await db.SaveChangesAsync();
        }

        // Login as admin
        var loginResp = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "khaledgmal644@gmail.com",
            password = "Admin123!"
        });
        loginResp.StatusCode.Should().Be(HttpStatusCode.OK);
        var auth = (await loginResp.Content.ReadFromJsonAsync<AuthenticationResult>())!;
        client.UseBearer(auth.AccessToken);

        // Fetch financial summary
        var response = await client.GetAsync("/api/admin/financials/summary");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var summary = await response.Content.ReadFromJsonAsync<AdminFinancialSummaryDto>();
        summary.Should().NotBeNull();
        summary!.CompletedOrderCount.Should().BeGreaterThanOrEqualTo(1);
        summary.GrossSalesVolume.Should().BeGreaterThanOrEqualTo(1130.00m);
        summary.TotalGrossItemSales.Should().BeGreaterThanOrEqualTo(1000.00m);
        summary.TotalPlatformCommission.Should().BeGreaterThanOrEqualTo(204.50m);
        summary.TotalDeliveryFees.Should().BeGreaterThanOrEqualTo(30.00m);
        summary.TotalPendingSellerPayouts.Should().BeGreaterThanOrEqualTo(900.00m); // 1000 - 100
    }
}
