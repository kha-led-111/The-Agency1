using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TheAgency.Application.Common.Interfaces;
using TheAgency.Application.Payments.Common;
using TheAgency.Domain.Entities;

namespace TheAgency.Application.Payments.Queries.GetMyLedger;

public sealed record GetMyLedgerQuery(Guid UserId) : IRequest<UserLedgerDto>;

public sealed class GetMyLedgerQueryHandler : IRequestHandler<GetMyLedgerQuery, UserLedgerDto>
{
    private readonly IApplicationDbContext _context;

    public GetMyLedgerQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserLedgerDto> Handle(GetMyLedgerQuery request, CancellationToken cancellationToken)
    {
        var ledger = await _context.UserLedgerAccounts
            .FirstOrDefaultAsync(l => l.UserId == request.UserId, cancellationToken);

        if (ledger is null)
        {
            ledger = new UserLedgerAccount
            {
                UserId = request.UserId,
                AvailableBalance = 0m,
                PendingCashHeld = 0m,
                TotalEarned = 0m,
                TotalFeesPaid = 0m,
                UpdatedAtUtc = DateTime.UtcNow
            };
        }

        return UserLedgerDto.From(ledger);
    }
}
