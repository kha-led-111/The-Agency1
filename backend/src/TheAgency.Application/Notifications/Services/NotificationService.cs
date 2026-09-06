using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Notifications.Common;
using TheAgency.Application.Notifications.Interfaces;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Notifications.Services;

public class NotificationService : INotificationService
{
    private readonly IApplicationDbContext _context;
    private readonly IEmailService _emailService;

    public NotificationService(IApplicationDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    public async Task<NotificationDto> CreateNotificationAsync(
        Guid userId,
        string title,
        string message,
        NotificationType type = NotificationType.InApp,
        CancellationToken cancellationToken = default)
    {
        var notification = new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            Status = type == NotificationType.InApp ? NotificationStatus.Unread : NotificationStatus.Pending,
            RetryCount = 0,
            MaxRetries = 3,
            IsDeadLettered = false,
            CreatedAtUtc = DateTime.UtcNow
        };

        if (type == NotificationType.Email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            var recipientEmail = user?.Email ?? "user@example.com";

            var success = await _emailService.SendEmailAsync(recipientEmail, title, message, cancellationToken);
            if (success)
            {
                notification.Status = NotificationStatus.Sent;
                notification.SentAtUtc = DateTime.UtcNow;
            }
            else
            {
                notification.Status = NotificationStatus.Failed;
                notification.RetryCount = 1;
            }
        }

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync(cancellationToken);

        return NotificationDto.From(notification);
    }

    public async Task<int> ProcessFailedRetriesAndDeadLettersAsync(CancellationToken cancellationToken = default)
    {
        var pendingNotifications = await _context.Notifications
            .Where(n => !n.IsDeadLettered && (n.Status == NotificationStatus.Failed || n.Status == NotificationStatus.Pending))
            .ToListAsync(cancellationToken);

        var processedCount = 0;

        foreach (var notification in pendingNotifications)
        {
            if (notification.RetryCount >= notification.MaxRetries)
            {
                notification.IsDeadLettered = true;
                notification.DeadLetterReason = $"Exceeded maximum retry threshold ({notification.MaxRetries} attempts).";
                notification.Status = NotificationStatus.Failed;
                processedCount++;
                continue;
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == notification.UserId, cancellationToken);
            var recipientEmail = user?.Email ?? "user@example.com";

            var success = await _emailService.SendEmailAsync(recipientEmail, notification.Title, notification.Message, cancellationToken);
            if (success)
            {
                notification.Status = NotificationStatus.Sent;
                notification.SentAtUtc = DateTime.UtcNow;
            }
            else
            {
                notification.RetryCount += 1;
                if (notification.RetryCount >= notification.MaxRetries)
                {
                    notification.IsDeadLettered = true;
                    notification.DeadLetterReason = "Delivery failed on final retry attempt.";
                    notification.Status = NotificationStatus.Failed;
                }
            }

            processedCount++;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return processedCount;
    }
}
