using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using MediatR;
using TheAgency.Application.Common.Interfaces;

namespace TheAgency.Application.Marketplace.Commands.UploadProductImage;

public sealed class UploadProductImageCommandHandler : IRequestHandler<UploadProductImageCommand, string>
{
    private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };

    private readonly IImageStorageService _storageService;

    public UploadProductImageCommandHandler(IImageStorageService storageService)
    {
        _storageService = storageService;
    }

    public async Task<string> Handle(UploadProductImageCommand request, CancellationToken cancellationToken)
    {
        if (request.FileStream is null || request.Length <= 0)
        {
            throw new ValidationException("Uploaded file is empty.");
        }

        if (request.Length > MaxFileSizeBytes)
        {
            throw new ValidationException("File size exceeds 5 MB limit.");
        }

        var extension = Path.GetExtension(request.FileName);
        if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
        {
            throw new ValidationException("Invalid image file format. Only JPG, PNG, and WebP are allowed.");
        }

        // Validate image magic bytes
        byte[] header = new byte[8];
        var readBytes = await request.FileStream.ReadAsync(header, 0, header.Length, cancellationToken);
        request.FileStream.Position = 0; // Reset position for storage handler

        if (readBytes < 4 || !IsValidImageHeader(header, extension))
        {
            throw new ValidationException("File payload magic header does not match a valid image.");
        }

        var safeFileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        return await _storageService.SaveImageAsync(request.FileStream, safeFileName, request.ContentType, cancellationToken);
    }

    private static bool IsValidImageHeader(byte[] header, string extension)
    {
        var ext = extension.ToLowerInvariant();
        if (ext is ".jpg" or ".jpeg")
        {
            return header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF;
        }

        if (ext == ".png")
        {
            return header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47;
        }

        if (ext == ".webp")
        {
            return header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46; // RIFF header
        }

        return false;
    }
}
