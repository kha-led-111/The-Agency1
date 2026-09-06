using System;
using TheAgency.Domain.Enums;

namespace TheAgency.Domain.Entities;

public class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; } = NotificationType.InApp;
    public NotificationStatus Status { get; set; } = NotificationStatus.Unread;
    public int RetryCount { get; set; } = 0;
    public int MaxRetries { get; set; } = 3;
    public bool IsDeadLettered { get; set; } = false;
    public string? DeadLetterReason { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAtUtc { get; set; }
    public DateTime? SentAtUtc { get; set; }

    public User User { get; set; } = default!;
}
