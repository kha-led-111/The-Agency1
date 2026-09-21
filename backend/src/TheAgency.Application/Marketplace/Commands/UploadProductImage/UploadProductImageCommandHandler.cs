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

    private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/jpg", "image/png", "image/webp"
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
            throw new ValidationException("الملف المرفق فارغ أو غير صالح.");
        }

        if (request.Length > MaxFileSizeBytes)
        {
            throw new ValidationException("حجم الصورة يتجاوز الحد الأقصى المسموح به (5 ميجابايت).");
        }

        var extension = Path.GetExtension(request.FileName);
        var isValidExtension = !string.IsNullOrWhiteSpace(extension) && AllowedExtensions.Contains(extension);

        if (!isValidExtension)
        {
            throw new ValidationException("صيغة الملف غير مدعومة. يسمح فقط بصور من نوع (JPG, JPEG, PNG, WebP).");
        }

        var isMimeValid = !string.IsNullOrWhiteSpace(request.ContentType) && AllowedMimeTypes.Contains(request.ContentType);
        if (!isMimeValid)
        {
            throw new ValidationException("نوع الملف (MIME type) غير مدعوم. يسمح فقط بصور من نوع (JPG, JPEG, PNG, WebP).");
        }

        // Validate image magic bytes
        byte[] header = new byte[8];
        var readBytes = await request.FileStream.ReadAsync(header, 0, header.Length, cancellationToken);
        request.FileStream.Position = 0; // Reset position for storage handler

        if (readBytes < 4 || !IsValidImageHeader(header, extension))
        {
            throw new ValidationException("محتوى الملف غير صالح ولا يطابق صيغ الصور المدعومة (JPG, PNG, WebP).");
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
