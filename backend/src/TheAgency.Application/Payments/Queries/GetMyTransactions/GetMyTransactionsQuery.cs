using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Payments.Common;

namespace TheAgency.Application.Payments.Queries.GetMyTransactions;

public sealed record GetMyTransactionsQuery(Guid UserId) : IRequest<IReadOnlyList<PaymentTransactionDto>>;

public sealed class GetMyTransactionsQueryHandler : IRequestHandler<GetMyTransactionsQuery, IReadOnlyList<PaymentTransactionDto>>
{
    private readonly IApplicationDbContext _context;

    public GetMyTransactionsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<PaymentTransactionDto>> Handle(GetMyTransactionsQuery request, CancellationToken cancellationToken)
    {
        var transactions = await _context.PaymentTransactions
            .Where(t => t.UserId == request.UserId)
            .OrderByDescending(t => t.CreatedAtUtc)
            .Select(t => PaymentTransactionDto.From(t))
            .ToListAsync(cancellationToken);

        return transactions;
    }
}
