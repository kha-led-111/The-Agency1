using System;
using TheAgency.Domain.Entities;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Notifications.Common;

public sealed record NotificationDto(
    Guid Id,
    Guid UserId,
    string Title,
    string Message,
    NotificationType Type,
    NotificationStatus Status,
    int RetryCount,
    int MaxRetries,
    bool IsDeadLettered,
    string? DeadLetterReason,
    DateTime CreatedAtUtc,
    DateTime? ReadAtUtc,
    DateTime? SentAtUtc
)
{
    public static NotificationDto From(Notification n) => new(
        n.Id,
        n.UserId,
        n.Title,
        n.Message,
        n.Type,
        n.Status,
        n.RetryCount,
        n.MaxRetries,
        n.IsDeadLettered,
        n.DeadLetterReason,
        n.CreatedAtUtc,
        n.ReadAtUtc,
        n.SentAtUtc
    );
}
