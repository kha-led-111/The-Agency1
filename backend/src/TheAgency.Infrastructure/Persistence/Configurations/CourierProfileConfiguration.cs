using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TheAgency.Domain.Entities;

namespace TheAgency.Infrastructure.Persistence.Configurations;

public class CourierProfileConfiguration : IEntityTypeConfiguration<CourierProfile>
{
    public void Configure(EntityTypeBuilder<CourierProfile> builder)
    {
        builder.ToTable("CourierProfiles");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.VehicleType)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.DeliveryZone)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.Rating)
            .HasPrecision(3, 2);

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => x.UserId)
            .IsUnique();

        builder.HasIndex(x => x.IsAvailable);
        builder.HasIndex(x => x.DeliveryZone);
    }
}
