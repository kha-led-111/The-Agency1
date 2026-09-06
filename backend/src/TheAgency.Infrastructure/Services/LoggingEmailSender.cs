using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TheAgency.Application.Common.Interfaces;

namespace TheAgency.Infrastructure.Services;

public sealed class LoggingEmailSender : IEmailSender
{
    private readonly ILogger<LoggingEmailSender> _logger;

    public LoggingEmailSender(ILogger<LoggingEmailSender> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(string to, string subject, string purpose, string plaintextToken, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Queued {Purpose} email to {Email} ({Subject}).", purpose, to, subject);
        return Task.CompletedTask;
    }
}
