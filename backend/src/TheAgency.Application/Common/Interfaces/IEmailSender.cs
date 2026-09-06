using System.Threading;
using System.Threading.Tasks;

namespace TheAgency.Application.Common.Interfaces;

public interface IEmailSender
{
    Task SendAsync(string to, string subject, string purpose, string plaintextToken, CancellationToken cancellationToken);
}
