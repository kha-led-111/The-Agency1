using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TheAgency.Domain.Entities;

namespace TheAgency.Infrastructure.Persistence.Configurations;

public class AccountTokenConfiguration : IEntityTypeConfiguration<AccountToken>
{
    public void Configure(EntityTypeBuilder<AccountToken> builder)
    {
        builder.ToTable("account_tokens");
        builder.HasKey(t => t.Id);

        builder.Ignore(t => t.IsExpired);
        builder.Ignore(t => t.IsUsed);
        builder.Ignore(t => t.IsActive);

        builder.Property(t => t.TokenHash)
            .IsRequired()
            .HasMaxLength(128);

        builder.HasIndex(t => t.TokenHash)
            .IsUnique();

        builder.Property(t => t.Purpose)
            .IsRequired()
            .HasConversion<string>();
    }
}
