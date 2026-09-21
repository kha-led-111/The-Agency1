using System;
using System.Text.RegularExpressions;

namespace TheAgency.Domain.Services;

public static class ContactInfoDetector
{
    private static readonly Regex EgyptianPhoneRegex = new(
        @"(?:\+?20|0020|0)?1[0125][\s.-]?\d{3,4}[\s.-]?\d{4}",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex ExternalLinkRegex = new(
        @"(?:facebook\.com|fb\.com|fb\.me|instagram\.com|instagr\.am|wa\.me|whatsapp\.com|t\.me|telegram|viber|tiktok\.com|https?://|www\.|[a-zA-Z0-9-]+\.(?:com|net|org|me|link|site))",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex SocialKeywordRegex = new(
        @"(?:واتساب|واتس|فيس|فيسبوك|انستجرام|أنستجرام|تليجرام|تيك توك)",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public static bool ContainsContactInfo(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return false;

        if (EgyptianPhoneRegex.IsMatch(input))
            return true;

        if (ExternalLinkRegex.IsMatch(input))
            return true;

        if (SocialKeywordRegex.IsMatch(input) && Regex.IsMatch(input, @"\d{5,}|@[\w_]+"))
            return true;

        return false;
    }
}
