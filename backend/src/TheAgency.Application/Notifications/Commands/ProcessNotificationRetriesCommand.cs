using System.Threading;
using System.Threading.Tasks;
using MediatR;
using TheAgency.Application.Notifications.Interfaces;

namespace TheAgency.Application.Notifications.Commands;

public sealed record ProcessNotificationRetriesCommand() : IRequest<int>;

public sealed class ProcessNotificationRetriesCommandHandler : IRequestHandler<ProcessNotificationRetriesCommand, int>
{
    private readonly INotificationService _notificationService;

    public ProcessNotificationRetriesCommandHandler(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    public async Task<int> Handle(ProcessNotificationRetriesCommand request, CancellationToken cancellationToken)
    {
        return await _notificationService.ProcessFailedRetriesAndDeadLettersAsync(cancellationToken);
    }
}
