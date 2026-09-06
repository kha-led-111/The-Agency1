using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TheAgency.Domain.Entities;

namespace TheAgency.Infrastructure.Persistence.Configurations;

public class UserLedgerAccountConfiguration : IEntityTypeConfiguration<UserLedgerAccount>
{
    public void Configure(EntityTypeBuilder<UserLedgerAccount> builder)
    {
        builder.ToTable("UserLedgerAccounts");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.AvailableBalance)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(x => x.PendingCashHeld)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(x => x.TotalEarned)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(x => x.TotalFeesPaid)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => x.UserId)
            .IsUnique();
    }
}
