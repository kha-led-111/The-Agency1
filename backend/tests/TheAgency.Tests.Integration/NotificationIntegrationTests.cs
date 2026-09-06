using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Threading.Tasks;
using FluentAssertions;
using TheAgency.Application.Identity.Common;
using TheAgency.Application.Notifications.Common;

namespace TheAgency.Tests.Integration;

public class NotificationIntegrationTests : IClassFixture<AgencyWebApplicationFactory>
{
    private readonly AgencyWebApplicationFactory _factory;

    public NotificationIntegrationTests(AgencyWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<(HttpClient Client, AuthenticationResult Auth)> CreateAuthenticatedUserAsync(string emailPrefix = "notifuser")
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
    public async Task NotificationFlow_UnreadCount_MarkRead_And_RetryProcessing_ShouldSucceed()
    {
        var (userClient, _) = await CreateAuthenticatedUserAsync("notifbuyer");

        // 1. Get Unread Count (should be >= 0)
        var unreadResponse = await userClient.GetAsync("/api/notifications/unread-count");
        unreadResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var initialUnread = await unreadResponse.Content.ReadFromJsonAsync<int>();

        // 2. Fetch Notifications List
        var notifListResponse = await userClient.GetAsync("/api/notifications");
        notifListResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var notifications = (await notifListResponse.Content.ReadFromJsonAsync<List<NotificationDto>>())!;
        notifications.Should().NotBeNull();

        // 3. Trigger Retries Processor API
        var retryProcessResponse = await userClient.PostAsync("/api/notifications/process-retries", null);
        retryProcessResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var processedCount = await retryProcessResponse.Content.ReadFromJsonAsync<int>();
        processedCount.Should().BeGreaterThanOrEqualTo(0);

        // 4. Mark All as Read
        var readAllResponse = await userClient.PostAsync("/api/notifications/read-all", null);
        readAllResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // 5. Verify Unread Count is now 0
        var finalUnreadResponse = await userClient.GetAsync("/api/notifications/unread-count");
        var finalUnread = await finalUnreadResponse.Content.ReadFromJsonAsync<int>();
        finalUnread.Should().Be(0);
    }
}
