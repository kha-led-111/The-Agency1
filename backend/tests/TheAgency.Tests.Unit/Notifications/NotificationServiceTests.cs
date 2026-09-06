using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Notifications.Interfaces;
using TheAgency.Application.Notifications.Services;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;
using TheAgency.Infrastructure.Persistence;
using Xunit;

namespace TheAgency.Tests.Unit.Notifications;

public class NotificationServiceTests
{
    private sealed class FakeEmailService : IEmailService
    {
        public bool ShouldSucceed { get; set; } = true;

        public Task<bool> SendEmailAsync(string recipientEmail, string subject, string body, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(ShouldSucceed);
        }
    }

    private static ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task CreateNotificationAsync_InApp_CreatesUnreadNotification()
    {
        using var context = CreateInMemoryDbContext();
        var fakeEmail = new FakeEmailService();

        var userId = Guid.NewGuid();
        var service = new NotificationService(context, fakeEmail);

        var result = await service.CreateNotificationAsync(userId, "Order Update", "Your order has been shipped.", NotificationType.InApp);

        result.Should().NotBeNull();
        result.Type.Should().Be(NotificationType.InApp);
        result.Status.Should().Be(NotificationStatus.Unread);
        result.IsDeadLettered.Should().BeFalse();
    }

    [Fact]
    public async Task ProcessFailedRetriesAndDeadLettersAsync_MaxRetriesExceeded_DeadLettersNotification()
    {
        using var context = CreateInMemoryDbContext();
        var fakeEmail = new FakeEmailService { ShouldSucceed = false };

        var userId = Guid.NewGuid();
        var notification = new Notification
        {
            UserId = userId,
            Title = "Welcome",
            Message = "Welcome to ElWkalla",
            Type = NotificationType.Email,
            Status = NotificationStatus.Failed,
            RetryCount = 3, // Reached max retries
            MaxRetries = 3,
            IsDeadLettered = false
        };

        context.Notifications.Add(notification);
        await context.SaveChangesAsync();

        var service = new NotificationService(context, fakeEmail);
        var processedCount = await service.ProcessFailedRetriesAndDeadLettersAsync();

        processedCount.Should().Be(1);

        var updatedNotification = await context.Notifications.FindAsync(notification.Id);
        updatedNotification!.IsDeadLettered.Should().BeTrue();
        updatedNotification.DeadLetterReason.Should().Contain("Exceeded maximum retry threshold");
    }
}
