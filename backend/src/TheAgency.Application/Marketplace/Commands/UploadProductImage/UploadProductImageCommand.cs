using System.IO;
using MediatR;

namespace TheAgency.Application.Marketplace.Commands.UploadProductImage;

public sealed record UploadProductImageCommand(
    Stream FileStream,
    string FileName,
    string ContentType,
    long Length
) : IRequest<string>;
