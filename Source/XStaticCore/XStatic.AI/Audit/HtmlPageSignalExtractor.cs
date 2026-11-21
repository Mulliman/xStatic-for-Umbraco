using System.Net;
using System.Text.RegularExpressions;

namespace XStatic.AI.Audit;

/// <summary>
/// Extracts deterministic SEO &amp; GEO signals from generated static HTML files before LLM synthesis.
/// </summary>
public interface IPageSignalExtractor
{
    IReadOnlyList<PageAuditSnapshot> ExtractFromDirectory(
        string siteOutputDirectory,
        int maxPages,
        int maxCharactersPerPage,
        int thinContentWordThreshold,
        IReadOnlyList<string>? includePathPrefixes,
        out int totalHtmlFilesDiscovered);
}

/// <summary>
/// Dependency-free HTML signal extractor for pre-deploy GEO/SEO auditing.
/// </summary>
public partial class HtmlPageSignalExtractor : IPageSignalExtractor
{
    private static readonly string[] IgnoredHrefSchemes =
    [
        "http://", "https://", "mailto:", "tel:", "javascript:", "data:", "#"
    ];

    public IReadOnlyList<PageAuditSnapshot> ExtractFromDirectory(
        string siteOutputDirectory,
        int maxPages,
        int maxCharactersPerPage,
        int thinContentWordThreshold,
        IReadOnlyList<string>? includePathPrefixes,
        out int totalHtmlFilesDiscovered)
    {
        if (string.IsNullOrWhiteSpace(siteOutputDirectory) || !Directory.Exists(siteOutputDirectory))
        {
            totalHtmlFilesDiscovered = 0;
            return Array.Empty<PageAuditSnapshot>();
        }

        var allFiles = Directory.EnumerateFiles(siteOutputDirectory, "*.*", SearchOption.AllDirectories)
            .Select(fullPath => NormalizeRelativePath(Path.GetRelativePath(siteOutputDirectory, fullPath)))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var htmlFiles = allFiles
            .Where(p => p.EndsWith(".html", StringComparison.OrdinalIgnoreCase)
                     || p.EndsWith(".htm", StringComparison.OrdinalIgnoreCase))
            .OrderBy(p => p, StringComparer.OrdinalIgnoreCase)
            .ToList();

        totalHtmlFilesDiscovered = htmlFiles.Count;

        IEnumerable<string> selectedFiles = htmlFiles;
        if (includePathPrefixes is { Count: > 0 })
        {
            var normalizedPrefixes = includePathPrefixes
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .Select(p => "/" + p.Trim().TrimStart('/'))
                .ToList();

            if (normalizedPrefixes.Count > 0)
            {
                selectedFiles = selectedFiles.Where(file =>
                    normalizedPrefixes.Any(prefix => file.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)));
            }
        }

        var effectiveLimit = maxPages > 0 ? maxPages : htmlFiles.Count;
        var snapshots = new List<PageAuditSnapshot>();

        foreach (var relativePath in selectedFiles.Take(effectiveLimit))
        {
            var fullPath = Path.Combine(siteOutputDirectory, relativePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
            if (!File.Exists(fullPath))
            {
                continue;
            }

            var html = File.ReadAllText(fullPath);
            snapshots.Add(AnalyzeHtml(relativePath, html, allFiles, maxCharactersPerPage, thinContentWordThreshold));
        }

        return snapshots;
    }

    internal PageAuditSnapshot AnalyzeHtml(
        string relativePath,
        string html,
        IReadOnlySet<string> existingSiteFiles,
        int maxCharactersPerPage,
        int thinContentWordThreshold)
    {
        var issues = new List<PageAuditIssue>();

        var title = ExtractInnerText(TitleRegex().Match(html));
        if (string.IsNullOrWhiteSpace(title))
        {
            issues.Add(new PageAuditIssue(relativePath, AuditSeverity.Critical, "Metadata", "Missing <title> element."));
        }
        else if (title.Length > 65)
        {
            issues.Add(new PageAuditIssue(relativePath, AuditSeverity.Info, "Metadata", $"<title> is {title.Length} characters (recommended <= 65)."));
        }

        var metaDescription = ExtractMetaContent(html, "name", "description");
        if (string.IsNullOrWhiteSpace(metaDescription))
        {
            issues.Add(new PageAuditIssue(relativePath, AuditSeverity.Warning, "Metadata", "Missing <meta name=\"description\"> tag."));
        }

        var canonicalUrl = ExtractCanonicalUrl(html);
        var hasOpenGraph = !string.IsNullOrWhiteSpace(ExtractMetaContent(html, "property", "og:title"))
            || !string.IsNullOrWhiteSpace(ExtractMetaContent(html, "property", "og:description"));
        var hasJsonLd = JsonLdRegex().IsMatch(html);

        if (!hasJsonLd)
        {
            issues.Add(new PageAuditIssue(relativePath, AuditSeverity.Info, "GEO", "No JSON-LD structured data (<script type=\"application/ld+json\">) found."));
        }

        var h1Matches = H1Regex().Matches(html);
        var primaryH1 = h1Matches.Count > 0 ? StripTagsAndNormalizeWhitespace(h1Matches[0].Groups[1].Value) : null;
        if (h1Matches.Count == 0)
        {
            issues.Add(new PageAuditIssue(relativePath, AuditSeverity.Warning, "Structure", "Missing primary <h1> heading."));
        }
        else if (h1Matches.Count > 1)
        {
            issues.Add(new PageAuditIssue(relativePath, AuditSeverity.Info, "Structure", $"Page contains {h1Matches.Count} <h1> headings; prefer a single primary <h1>."));
        }

        var imgMatches = ImgTagRegex().Matches(html);
        var imagesMissingAlt = 0;
        foreach (Match img in imgMatches)
        {
            var attrs = img.Groups[1].Value;
            var altMatch = AltAttrRegex().Match(attrs);
            if (!altMatch.Success || string.IsNullOrWhiteSpace(WebUtility.HtmlDecode(altMatch.Groups[2].Value)))
            {
                imagesMissingAlt++;
            }
        }

        if (imagesMissingAlt > 0)
        {
            issues.Add(new PageAuditIssue(
                relativePath,
                AuditSeverity.Warning,
                "Accessibility",
                $"{imagesMissingAlt} of {imgMatches.Count} image(s) are missing descriptive alt text."));
        }

        var brokenLinks = FindBrokenInternalLinks(relativePath, html, existingSiteFiles);
        foreach (var broken in brokenLinks)
        {
            issues.Add(new PageAuditIssue(
                relativePath,
                AuditSeverity.Critical,
                "Links",
                $"Broken internal link: '{broken}'."));
        }

        var visibleText = ExtractVisibleText(html);
        var wordCount = CountWords(visibleText);
        if (wordCount < thinContentWordThreshold)
        {
            issues.Add(new PageAuditIssue(
                relativePath,
                AuditSeverity.Warning,
                "Content",
                $"Thin content detected ({wordCount} words; threshold is {thinContentWordThreshold})."));
        }

        var excerpt = maxCharactersPerPage > 0 && visibleText.Length > maxCharactersPerPage
            ? visibleText[..maxCharactersPerPage] + "..."
            : visibleText;

        return new PageAuditSnapshot(
            RelativePath: relativePath,
            Title: title,
            MetaDescription: metaDescription,
            CanonicalUrl: canonicalUrl,
            H1Count: h1Matches.Count,
            PrimaryH1: primaryH1,
            TotalImageCount: imgMatches.Count,
            ImagesMissingAltCount: imagesMissingAlt,
            WordCount: wordCount,
            HasJsonLdStructuredData: hasJsonLd,
            HasOpenGraphTags: hasOpenGraph,
            BrokenInternalLinks: brokenLinks,
            DeterministicIssues: issues,
            PlainTextExcerpt: excerpt);
    }

    private static IReadOnlyList<string> FindBrokenInternalLinks(
        string currentRelativePath,
        string html,
        IReadOnlySet<string> existingSiteFiles)
    {
        var broken = new List<string>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (Match match in AnchorHrefRegex().Matches(html))
        {
            var rawHref = WebUtility.HtmlDecode(match.Groups[2].Value).Trim();
            if (string.IsNullOrWhiteSpace(rawHref) || IsExternalOrNonNavigable(rawHref))
            {
                continue;
            }

            if (!seen.Add(rawHref))
            {
                continue;
            }

            var cleaned = StripQueryAndFragment(rawHref);
            if (string.IsNullOrWhiteSpace(cleaned))
            {
                continue;
            }

            var resolvedPath = ResolveRelativeLink(currentRelativePath, cleaned);
            if (!TargetExists(resolvedPath, existingSiteFiles))
            {
                broken.Add(rawHref);
            }
        }

        return broken;
    }

    private static bool IsExternalOrNonNavigable(string href)
    {
        if (href.StartsWith("//", StringComparison.Ordinal))
        {
            return true;
        }

        foreach (var scheme in IgnoredHrefSchemes)
        {
            if (href.StartsWith(scheme, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private static string StripQueryAndFragment(string href)
    {
        var idx = href.IndexOfAny(['?', '#']);
        return idx >= 0 ? href[..idx] : href;
    }

    private static string ResolveRelativeLink(string currentRelativePath, string href)
    {
        var baseUri = new Uri("https://xstatic.local" + currentRelativePath);
        if (Uri.TryCreate(baseUri, href, out var resolved))
        {
            return Uri.UnescapeDataString(resolved.AbsolutePath);
        }

        return href.StartsWith('/') ? href : "/" + href;
    }

    private static bool TargetExists(string resolvedPath, IReadOnlySet<string> existingSiteFiles)
    {
        var normalized = "/" + resolvedPath.TrimStart('/');
        if (existingSiteFiles.Contains(normalized))
        {
            return true;
        }

        if (normalized.EndsWith('/'))
        {
            return existingSiteFiles.Contains(normalized + "index.html")
                || existingSiteFiles.Contains(normalized + "index.htm");
        }

        return existingSiteFiles.Contains(normalized + "/index.html")
            || existingSiteFiles.Contains(normalized + "/index.htm")
            || existingSiteFiles.Contains(normalized + ".html")
            || existingSiteFiles.Contains(normalized + ".htm");
    }

    private static string? ExtractMetaContent(string html, string keyAttr, string keyValue)
    {
        foreach (Match match in MetaTagRegex().Matches(html))
        {
            var attrs = match.Groups[1].Value;
            var keyMatch = Regex.Match(
                attrs,
                $@"\b{keyAttr}\s*=\s*([""'])(.*?)\1",
                RegexOptions.IgnoreCase | RegexOptions.Singleline);

            if (!keyMatch.Success || !string.Equals(keyMatch.Groups[2].Value.Trim(), keyValue, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var contentMatch = ContentAttrRegex().Match(attrs);
            if (contentMatch.Success)
            {
                return WebUtility.HtmlDecode(contentMatch.Groups[2].Value).Trim();
            }
        }

        return null;
    }

    private static string? ExtractCanonicalUrl(string html)
    {
        foreach (Match match in LinkTagRegex().Matches(html))
        {
            var attrs = match.Groups[1].Value;
            var relMatch = RelAttrRegex().Match(attrs);
            if (!relMatch.Success || !relMatch.Groups[2].Value.Contains("canonical", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var hrefMatch = HrefAttrRegex().Match(attrs);
            if (hrefMatch.Success)
            {
                return WebUtility.HtmlDecode(hrefMatch.Groups[2].Value).Trim();
            }
        }

        return null;
    }

    private static string? ExtractInnerText(Match match)
    {
        if (!match.Success)
        {
            return null;
        }

        var text = StripTagsAndNormalizeWhitespace(match.Groups[1].Value);
        return string.IsNullOrWhiteSpace(text) ? null : text;
    }

    private static string ExtractVisibleText(string html)
    {
        var bodyMatch = BodyRegex().Match(html);
        var source = bodyMatch.Success ? bodyMatch.Groups[1].Value : html;
        var withoutScripts = ScriptStyleRegex().Replace(source, " ");
        return StripTagsAndNormalizeWhitespace(withoutScripts);
    }

    private static string StripTagsAndNormalizeWhitespace(string input)
    {
        var withoutTags = HtmlTagRegex().Replace(input, " ");
        var decoded = WebUtility.HtmlDecode(withoutTags);
        return WhitespaceRegex().Replace(decoded, " ").Trim();
    }

    private static int CountWords(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return 0;
        }

        return text.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
    }

    private static string NormalizeRelativePath(string relativePath)
    {
        return "/" + relativePath.Replace('\\', '/').TrimStart('/');
    }

    [GeneratedRegex(@"<title\b[^>]*>(.*?)</title>", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex TitleRegex();

    [GeneratedRegex(@"<h1\b[^>]*>(.*?)</h1>", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex H1Regex();

    [GeneratedRegex(@"<meta\b([^>]*)/?>", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex MetaTagRegex();

    [GeneratedRegex(@"<link\b([^>]*)/?>", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex LinkTagRegex();

    [GeneratedRegex(@"<img\b([^>]*)/?>", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex ImgTagRegex();

    [GeneratedRegex(@"<a\b[^>]*\bhref\s*=\s*([""'])(.*?)\1", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex AnchorHrefRegex();

    [GeneratedRegex(@"\balt\s*=\s*([""'])(.*?)\1", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex AltAttrRegex();

    [GeneratedRegex(@"\bcontent\s*=\s*([""'])(.*?)\1", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex ContentAttrRegex();

    [GeneratedRegex(@"\brel\s*=\s*([""'])(.*?)\1", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex RelAttrRegex();

    [GeneratedRegex(@"\bhref\s*=\s*([""'])(.*?)\1", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex HrefAttrRegex();

    [GeneratedRegex(@"<script\b[^>]*type\s*=\s*[""']application/ld\+json[""'][^>]*>", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex JsonLdRegex();

    [GeneratedRegex(@"<body\b[^>]*>(.*?)</body>", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex BodyRegex();

    [GeneratedRegex(@"<(script|style|noscript)\b[^>]*>.*?</\1>", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex ScriptStyleRegex();

    [GeneratedRegex(@"<[^>]+>", RegexOptions.Singleline)]
    private static partial Regex HtmlTagRegex();

    [GeneratedRegex(@"\s+")]
    private static partial Regex WhitespaceRegex();
}
