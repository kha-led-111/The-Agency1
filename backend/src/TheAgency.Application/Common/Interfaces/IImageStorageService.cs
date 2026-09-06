using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace TheAgency.Application.Common.Interfaces;

public interface IImageStorageService
{
    Task<string> SaveImageAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default);
}
