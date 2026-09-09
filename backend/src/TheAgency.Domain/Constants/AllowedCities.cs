using System;
using System.Collections.Generic;
using System.Linq;

namespace TheAgency.Domain.Constants;

public static class AllowedCities
{
    public static readonly IReadOnlyList<string> Cities = new[]
    {
        "المحلة الكبرى",
        "طنطا",
        "شبين الكوم",
        "المنصورة"
    };

    private static readonly HashSet<string> NormalizedAllowedCities = new(StringComparer.OrdinalIgnoreCase)
    {
        "المحلة الكبرى",
        "المحله الكبري",
        "المحلة الكبري",
        "المحله الكبرى",
        "المحلة",
        "طنطا",
        "شبين الكوم",
        "شبين",
        "المنصورة",
        "المنصوره"
    };

    /// <summary>
    /// Checks whether an address or city string specifies one of the 4 allowed Egyptian cities.
    /// </summary>
    public static bool IsCityAllowed(string? addressOrCity)
    {
        if (string.IsNullOrWhiteSpace(addressOrCity))
            return false;

        var normalizedInput = addressOrCity.Trim();

        // 1. Direct match with normalized list
        if (NormalizedAllowedCities.Contains(normalizedInput))
            return true;

        // 2. Substring check inside detailed address string
        return NormalizedAllowedCities.Any(allowed => normalizedInput.Contains(allowed, StringComparison.OrdinalIgnoreCase));
    }
}
