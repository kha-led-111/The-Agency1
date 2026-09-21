using System;
using System.Collections.Generic;
using System.Linq;

namespace TheAgency.Domain.Constants;

public static class AllowedCities
{
    public const string UnsupportedErrorMessage = "عذراً، خدمة المنصة متوفرة حالياً فقط في محافظات الغربية، المنوفية، والدقهلية";

    public static readonly IReadOnlyList<string> AllowedGovernorates = new[]
    {
        "الغربية",
        "المنوفية",
        "الدقهلية"
    };

    public static readonly IReadOnlyList<string> Cities = new[]
    {
        "المحلة الكبرى",
        "طنطا",
        "شبين الكوم",
        "المنصورة"
    };

    public static readonly IReadOnlyDictionary<string, IReadOnlyList<string>> GovernorateCitiesMap =
        new Dictionary<string, IReadOnlyList<string>>(StringComparer.OrdinalIgnoreCase)
        {
            ["الغربية"] = new[] { "المحلة الكبرى", "طنطا" },
            ["المنوفية"] = new[] { "شبين الكوم" },
            ["الدقهلية"] = new[] { "المنصورة" }
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

    public static bool IsGovernorateAllowed(string? governorate)
    {
        if (string.IsNullOrWhiteSpace(governorate)) return false;
        var norm = governorate.Trim();
        return norm.Contains("الغربية", StringComparison.OrdinalIgnoreCase) ||
               norm.Contains("المنوفية", StringComparison.OrdinalIgnoreCase) ||
               norm.Contains("الدقهلية", StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsLocationAllowed(string? governorate, string? city, string? addressOrLocation = null)
    {
        var hasGov = !string.IsNullOrWhiteSpace(governorate);
        var hasCity = !string.IsNullOrWhiteSpace(city);
        var hasAddress = !string.IsNullOrWhiteSpace(addressOrLocation);

        if (!hasGov && !hasCity && !hasAddress)
            return true;

        if (hasGov && hasCity)
        {
            var normGov = governorate!.Trim();
            var normCity = city!.Trim();

            string? matchedGovKey = null;
            if (normGov.Contains("الغربية", StringComparison.OrdinalIgnoreCase)) matchedGovKey = "الغربية";
            else if (normGov.Contains("المنوفية", StringComparison.OrdinalIgnoreCase)) matchedGovKey = "المنوفية";
            else if (normGov.Contains("الدقهلية", StringComparison.OrdinalIgnoreCase)) matchedGovKey = "الدقهلية";

            if (matchedGovKey is null) return false;

            var allowedCitiesInGov = GovernorateCitiesMap[matchedGovKey];
            return allowedCitiesInGov.Any(ac => IsCityMatching(normCity, ac));
        }

        var combined = $"{governorate} {city} {addressOrLocation}".Trim();
        return IsCityAllowed(combined);
    }

    private static bool IsCityMatching(string input, string targetAllowedCity)
    {
        if (input.Equals(targetAllowedCity, StringComparison.OrdinalIgnoreCase)) return true;
        if (targetAllowedCity == "المحلة الكبرى" && (input.Contains("المحلة", StringComparison.OrdinalIgnoreCase) || input.Contains("المحله", StringComparison.OrdinalIgnoreCase))) return true;
        if (targetAllowedCity == "شبين الكوم" && input.Contains("شبين", StringComparison.OrdinalIgnoreCase)) return true;
        if (targetAllowedCity == "المنصورة" && (input.Contains("المنصورة", StringComparison.OrdinalIgnoreCase) || input.Contains("المنصوره", StringComparison.OrdinalIgnoreCase))) return true;
        if (targetAllowedCity == "طنطا" && input.Contains("طنطا", StringComparison.OrdinalIgnoreCase)) return true;
        return false;
    }

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
