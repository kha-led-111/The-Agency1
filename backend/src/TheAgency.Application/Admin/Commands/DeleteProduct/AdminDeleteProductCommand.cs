using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Exceptions;
using TheAgency.Application.Common.Interfaces;

namespace TheAgency.Application.Admin.Commands.DeleteProduct;

public record AdminDeleteProductCommand(Guid ProductId) : IRequest<bool>;

public sealed class AdminDeleteProductCommandHandler : IRequestHandler<AdminDeleteProductCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public AdminDeleteProductCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(AdminDeleteProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _context.Products
            .FirstOrDefaultAsync(x => x.Id == request.ProductId, cancellationToken);

        if (product is null)
        {
            throw new NotFoundException("Product listing was not found.");
        }

        _context.Products.Remove(product);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
