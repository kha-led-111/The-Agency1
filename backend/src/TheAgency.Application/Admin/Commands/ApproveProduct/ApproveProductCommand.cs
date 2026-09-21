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

namespace TheAgency.Application.Admin.Commands.ApproveProduct;

public record ApproveProductCommand(Guid ProductId) : IRequest<AdminProductReviewDto>;

public sealed class ApproveProductCommandHandler : IRequestHandler<ApproveProductCommand, AdminProductReviewDto>
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notificationService;

    public ApproveProductCommandHandler(IApplicationDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<AdminProductReviewDto> Handle(ApproveProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _context.Products
            .Include(x => x.Category)
            .Include(x => x.Seller)
            .FirstOrDefaultAsync(x => x.Id == request.ProductId, cancellationToken);

        if (product is null)
        {
            throw new NotFoundException("Product review item was not found.");
        }

        product.IsApproved = true;
        product.ApprovedAt = DateTime.UtcNow;
        product.Status = ProductStatus.Published;
        product.UpdatedAtUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        // Notify Seller
        if (product.SellerId != Guid.Empty)
        {
            await _notificationService.CreateNotificationAsync(
                product.SellerId,
                "تمت الموافقة على إعلانك",
                $"تمت الموافقة على نشر إعلانك \"{product.Title}\" وهو الآن متاح للمشترين على المنصة.",
                NotificationType.InApp,
                cancellationToken);
        }

        return AdminProductReviewDto.From(product);
    }
}
