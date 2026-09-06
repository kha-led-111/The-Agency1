using System;
using TheAgency.Domain.Entities;

namespace TheAgency.Application.Marketplace.Common;

public sealed record CategoryDto(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    int ProductCount
)
{
    public static CategoryDto From(Category category, int productCount = 0)
    {
        return new CategoryDto(
            category.Id,
            category.Name,
            category.Slug,
            category.Description,
            productCount
        );
    }
}
