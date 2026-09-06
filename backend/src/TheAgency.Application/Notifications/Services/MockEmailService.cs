using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TheAgency.Application.Notifications.Interfaces;

namespace TheAgency.Application.Notifications.Services;

public class MockEmailService : IEmailService
{
    private readonly ILogger<MockEmailService> _logger;

    public MockEmailService(ILogger<MockEmailService> logger)
    {
        _logger = logger;
    }

    public Task<bool> SendEmailAsync(string recipientEmail, string subject, string body, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("[MockEmailService] Email sent to {Email} | Subject: '{Subject}' | Body: '{Body}'", recipientEmail, subject, body);
        return Task.FromResult(true);
    }
}
