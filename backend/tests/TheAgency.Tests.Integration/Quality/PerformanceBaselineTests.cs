using System.Diagnostics;
using System.Net;
using FluentAssertions;
using Xunit;

namespace TheAgency.Tests.Integration.Quality;

public sealed class PerformanceBaselineTests : IClassFixture<AgencyWebApplicationFactory>
{
    private readonly AgencyWebApplicationFactory _factory;

    public PerformanceBaselineTests(AgencyWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    [Trait("Category", "PerformanceBenchmark")]
    public async Task MarketplaceBrowseAPI_LatencyBenchmark_MeetsSlaUnder50msAverage()
    {
        var client = _factory.CreateClient();

        // Warmup request
        await client.GetAsync("/api/marketplace");

        var iterations = 30;
        var stopwatch = Stopwatch.StartNew();

        for (int i = 0; i < iterations; i++)
        {
            var response = await client.GetAsync("/api/marketplace");
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        stopwatch.Stop();
        var averageLatencyMs = (double)stopwatch.ElapsedMilliseconds / iterations;

        // SLA Assert: Average response time should be well below 50ms per request in local test environment
        averageLatencyMs.Should().BeLessThan(50.0, "API response latency must meet strict SLA performance benchmark.");
    }
}
