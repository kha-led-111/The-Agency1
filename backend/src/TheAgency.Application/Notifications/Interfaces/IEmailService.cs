using System.Threading;
using System.Threading.Tasks;

namespace TheAgency.Application.Notifications.Interfaces;

public interface IEmailService
{
    Task<bool> SendEmailAsync(string recipientEmail, string subject, string body, CancellationToken cancellationToken = default);
}
