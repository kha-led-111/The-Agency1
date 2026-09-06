using FluentAssertions;
using Xunit;

namespace TheAgency.Tests.Integration;

public class ApiStartupTests : IClassFixture<AgencyWebApplicationFactory>
{
    private readonly AgencyWebApplicationFactory _factory;

    public ApiStartupTests(AgencyWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task SwaggerEndpoint_ShouldReturnSuccessStatusCode()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/swagger/v1/swagger.json");
        response.EnsureSuccessStatusCode();
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
    }

    [Fact]
    public async Task HealthEndpoint_ShouldReturnResponse()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/health");
        response.Should().NotBeNull();
    }
}
