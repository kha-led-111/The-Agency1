using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TheAgency.Domain.Entities;

namespace TheAgency.Infrastructure.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("orders");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.OrderNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(x => x.OrderNumber)
            .IsUnique();

        builder.Property(x => x.ItemPrice)
            .HasColumnType("decimal(18,2)");

        builder.Property(x => x.DeliveryFee)
            .HasColumnType("decimal(18,2)");

        builder.Property(x => x.BuyerFee)
            .HasColumnType("decimal(18,2)");

        builder.Property(x => x.SellerCommission)
            .HasColumnType("decimal(18,2)");

        builder.Property(x => x.CourierEarnings)
            .HasColumnType("decimal(18,2)");

        builder.Property(x => x.PlatformEarnings)
            .HasColumnType("decimal(18,2)");

        builder.Property(x => x.TotalAmount)
            .HasColumnType("decimal(18,2)");

        builder.Property(x => x.ReturnFee)
            .HasColumnType("decimal(18,2)");

        builder.Property(x => x.ReturnPercentageFee)
            .HasColumnType("decimal(18,2)");

        builder.Property(x => x.ShippingAddress)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(x => x.Status)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(x => x.PaymentMethod)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(x => x.IdempotencyKey)
            .HasMaxLength(120);

        builder.HasIndex(x => x.BuyerId);
        builder.HasIndex(x => x.DeliveryAgentId);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.CreatedAtUtc);
        builder.HasIndex(x => new { x.BuyerId, x.IdempotencyKey });

        builder.HasOne(x => x.Buyer)
            .WithMany()
            .HasForeignKey(x => x.BuyerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.DeliveryAgent)
            .WithMany()
            .HasForeignKey(x => x.DeliveryAgentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.OrderItems)
            .WithOne(x => x.Order)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
