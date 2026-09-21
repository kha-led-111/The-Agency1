using System;
using System.Collections.Generic;
using System.Linq;
using TheAgency.Domain.Entities;

namespace TheAgency.Application.Marketplace.Common;

public sealed record CategoryDto(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    int ProductCount = 0,
    Guid? ParentId = null,
    IReadOnlyList<CategoryDto>? Subcategories = null
)
{
    public static CategoryDto From(Category category, int productCount = 0, IReadOnlyList<CategoryDto>? subcategories = null)
    {
        return new CategoryDto(
            category.Id,
            category.Name,
            category.Slug,
            category.Description,
            productCount,
            category.ParentId,
            subcategories ?? (category.Subcategories != null && category.Subcategories.Count > 0
                ? category.Subcategories.Select(s => From(s, 0, null)).ToList()
                : null)
        );
    }
}
