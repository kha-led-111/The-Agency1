using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TheAgency.Domain.Entities;

namespace TheAgency.Infrastructure.Persistence.Configurations;

public class DeliveryTaskConfiguration : IEntityTypeConfiguration<DeliveryTask>
{
    public void Configure(EntityTypeBuilder<DeliveryTask> builder)
    {
        builder.ToTable("DeliveryTasks");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.PickupAddress)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(x => x.DeliveryAddress)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(x => x.FailureReason)
            .HasMaxLength(500);

        builder.HasOne(x => x.Order)
            .WithMany()
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Courier)
            .WithMany()
            .HasForeignKey(x => x.CourierId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => x.OrderId);
        builder.HasIndex(x => x.CourierId);
        builder.HasIndex(x => x.Status);
    }
}
