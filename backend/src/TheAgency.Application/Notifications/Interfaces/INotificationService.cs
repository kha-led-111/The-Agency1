using System;
using System.Threading;
using System.Threading.Tasks;
using TheAgency.Application.Notifications.Common;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Notifications.Interfaces;

public interface INotificationService
{
    Task<NotificationDto> CreateNotificationAsync(
        Guid userId,
        string title,
        string message,
        NotificationType type = NotificationType.InApp,
        CancellationToken cancellationToken = default);

    Task<int> ProcessFailedRetriesAndDeadLettersAsync(CancellationToken cancellationToken = default);
}
