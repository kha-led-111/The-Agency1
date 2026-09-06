using Microsoft.EntityFrameworkCore;
using TheAgency.Domain.Entities;

namespace TheAgency.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<AccountToken> AccountTokens { get; }
    DbSet<Category> Categories { get; }
    DbSet<Product> Products { get; }
    DbSet<Favorite> Favorites { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
    DbSet<PaymentTransaction> PaymentTransactions { get; }
    DbSet<UserLedgerAccount> UserLedgerAccounts { get; }
    DbSet<CourierProfile> CourierProfiles { get; }
    DbSet<DeliveryTask> DeliveryTasks { get; }
    DbSet<DeliveryTrackingEvent> DeliveryTrackingEvents { get; }
    DbSet<Notification> Notifications { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
