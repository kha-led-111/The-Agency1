using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using TheAgency.Application.Common.Interfaces;

namespace TheAgency.Infrastructure.Services;

public class LocalImageStorageService : IImageStorageService
{
    private readonly IWebHostEnvironment _environment;

    public LocalImageStorageService(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task<string> SaveImageAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        var uploadsFolder = Path.Combine(_environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var filePath = Path.Combine(uploadsFolder, fileName);
        using (var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await stream.CopyToAsync(fileStream, cancellationToken);
        }

        return $"/uploads/{fileName}";
    }
}
