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

        builder.HasMany(x => x.Products)
            .WithOne(x => x.Category)
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        var seedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        builder.HasData(
            new Category { Id = ElectronicsId, Name = "Electronics", Slug = "electronics", Description = "Phones, laptops, gadgets & accessories", IsActive = true, CreatedAtUtc = seedDate },
            new Category { Id = FashionId, Name = "Fashion", Slug = "fashion", Description = "Clothing, shoes, bags & watches", IsActive = true, CreatedAtUtc = seedDate },
            new Category { Id = HomeGardenId, Name = "Home & Garden", Slug = "home-garden", Description = "Furniture, decor & appliances", IsActive = true, CreatedAtUtc = seedDate },
            new Category { Id = BooksMediaId, Name = "Books & Media", Slug = "books-media", Description = "Textbooks, novels & media", IsActive = true, CreatedAtUtc = seedDate },
            new Category { Id = VehiclesId, Name = "Vehicles", Slug = "vehicles", Description = "Cars, motorcycles & auto parts", IsActive = true, CreatedAtUtc = seedDate },
            new Category { Id = OtherId, Name = "General & Other", Slug = "general-other", Description = "Everything else", IsActive = true, CreatedAtUtc = seedDate }
        );
    }
}
