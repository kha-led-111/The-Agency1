using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Admin.Common;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Notifications.Interfaces;
using TheAgency.Domain.Enums;

namespace TheAgency.Application.Admin.Commands.RejectProduct;

public record RejectProductCommand(Guid ProductId, string Reason) : IRequest<AdminProductReviewDto>;

public sealed class RejectProductCommandHandler : IRequestHandler<RejectProductCommand, AdminProductReviewDto>
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notificationService;

    public RejectProductCommandHandler(IApplicationDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<AdminProductReviewDto> Handle(RejectProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _context.Products
            .Include(x => x.Category)
            .Include(x => x.Seller)
            .FirstOrDefaultAsync(x => x.Id == request.ProductId, cancellationToken);

        if (product is null)
        {
            throw new NotFoundException("Product review item was not found.");
        }

        var reason = string.IsNullOrWhiteSpace(request.Reason) ? "عدم استيفاء الشروط أو استكمال البيانات المطلوب." : request.Reason.Trim();

        product.IsApproved = false;
        product.Status = ProductStatus.Rejected;
        product.UpdatedAtUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        // Notify Seller with Reason
        if (product.SellerId != Guid.Empty)
        {
            await _notificationService.CreateNotificationAsync(
                product.SellerId,
                "تم رفض الإعلان",
                $"تم رفض إعلانك \"{product.Title}\". سبب الرفض: {reason}",
                NotificationType.InApp,
                cancellationToken);
        }

        return AdminProductReviewDto.From(product);
    }
}
