using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TheAgency.Domain.Entities;

namespace TheAgency.Infrastructure.Persistence.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public static readonly Guid ElectronicsId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public static readonly Guid FashionId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    public static readonly Guid HomeGardenId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    public static readonly Guid BooksMediaId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    public static readonly Guid VehiclesId = Guid.Parse("55555555-5555-5555-5555-555555555555");
    public static readonly Guid OtherId = Guid.Parse("66666666-6666-6666-6666-666666666666");

    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("categories");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Slug)
            .IsRequired()
            .HasMaxLength(120);

        builder.HasIndex(x => x.Slug)
            .IsUnique();

        builder.HasOne(x => x.Parent)
            .WithMany(x => x.Subcategories)
            .HasForeignKey(x => x.ParentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Products)
            .WithOne(x => x.Category)
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        var seedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        builder.HasData(
            new Category { Id = ElectronicsId, Name = "إلكترونيات", Slug = "electronics", Description = "هواتف، كمبيوتر، وإلكترونيات ذكية", IsActive = true, CreatedAtUtc = seedDate },
            new Category { Id = FashionId, Name = "ملابس نسائية", Slug = "fashion", Description = "ملابس، أزياء، حقائب وإكسسوارات نسائية", IsActive = true, CreatedAtUtc = seedDate },
            new Category { Id = HomeGardenId, Name = "أثاث ومنزل", Slug = "home-garden", Description = "أثاث، ديكور ومستلزمات منزلية", IsActive = true, CreatedAtUtc = seedDate },
            new Category { Id = BooksMediaId, Name = "كتب وميديا", Slug = "books-media", Description = "كتب، روايات ومستلزمات تعليمية", IsActive = true, CreatedAtUtc = seedDate },
            new Category { Id = VehiclesId, Name = "سيارات ومحركات", Slug = "vehicles", Description = "سيارات، دراجات وقطع غيار", IsActive = true, CreatedAtUtc = seedDate },
            new Category { Id = OtherId, Name = "عام وأخرى", Slug = "general-other", Description = "منتجات أخرى متنوعة", IsActive = true, CreatedAtUtc = seedDate }
        );
    }
}
