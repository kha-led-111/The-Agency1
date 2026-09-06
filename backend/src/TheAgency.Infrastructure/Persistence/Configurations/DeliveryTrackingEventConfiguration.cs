using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TheAgency.Domain.Entities;

namespace TheAgency.Infrastructure.Persistence.Configurations;

public class DeliveryTrackingEventConfiguration : IEntityTypeConfiguration<DeliveryTrackingEvent>
{
    public void Configure(EntityTypeBuilder<DeliveryTrackingEvent> builder)
    {
        builder.ToTable("DeliveryTrackingEvents");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Note)
            .HasMaxLength(500);

        builder.HasOne(x => x.DeliveryTask)
            .WithMany(x => x.TrackingEvents)
            .HasForeignKey(x => x.DeliveryTaskId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.DeliveryTaskId);
    }
}
