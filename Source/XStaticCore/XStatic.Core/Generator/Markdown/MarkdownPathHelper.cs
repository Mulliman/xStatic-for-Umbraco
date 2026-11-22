using System;
using System.Globalization;
using System.Linq;

namespace XStatic.Core.Generator.Markdown
{
    public static class MarkdownPathHelper
    {
        public static string GetCompanionMarkdownPath(string htmlFilePath)
        {
            if (string.IsNullOrWhiteSpace(htmlFilePath))
            {
                return "index.md";
            }

            var normalized = htmlFilePath.Replace('\\', '/').TrimStart('/');

            if (normalized.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
            {
                return normalized.Substring(0, normalized.Length - 5) + ".md";
            }

            if (normalized.EndsWith(".htm", StringComparison.OrdinalIgnoreCase))
            {
                return normalized.Substring(0, normalized.Length - 4) + ".md";
            }

            if (normalized.EndsWith(".md", StringComparison.OrdinalIgnoreCase))
            {
                return normalized;
            }

            return normalized.TrimEnd('/') + "/index.md";
        }

        public static string GetCompanionMarkdownHref(string pageUrl, string targetHostname = null)
        {
            if (string.IsNullOrWhiteSpace(pageUrl))
            {
                return "index.md";
            }

            var trimmed = pageUrl.Trim();

            if (Uri.TryCreate(trimmed, UriKind.Absolute, out var absoluteUri) &&
                (absoluteUri.Scheme == Uri.UriSchemeHttp || absoluteUri.Scheme == Uri.UriSchemeHttps))
            {
                var path = ConvertUrlPathToMarkdownPath(absoluteUri.AbsolutePath);
                var authority = absoluteUri.GetLeftPart(UriPartial.Authority).TrimEnd('/');
                return authority + path;
            }

            var withoutFragment = trimmed.Split('#')[0];
            var withoutQuery = withoutFragment.Split('?')[0];
            var markdownPath = ConvertUrlPathToMarkdownPath(withoutQuery);

            if (!string.IsNullOrWhiteSpace(targetHostname))
            {
                var baseUrl = NormalizeHostname(targetHostname);
                return baseUrl + markdownPath;
            }

            return markdownPath;
        }

        public static string GetPageUrlFromHtmlFilePath(string relativeHtmlFilePath, string targetHostname = null)
        {
            var normalized = (relativeHtmlFilePath ?? string.Empty).Replace('\\', '/').TrimStart('/');
            string relativeUrl;

            if (string.Equals(normalized, "index.html", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(normalized, "index.htm", StringComparison.OrdinalIgnoreCase))
            {
                relativeUrl = "/";
            }
            else if (normalized.EndsWith("/index.html", StringComparison.OrdinalIgnoreCase))
            {
                relativeUrl = "/" + normalized.Substring(0, normalized.Length - "index.html".Length);
            }
            else if (normalized.EndsWith("/index.htm", StringComparison.OrdinalIgnoreCase))
            {
                relativeUrl = "/" + normalized.Substring(0, normalized.Length - "index.htm".Length);
            }
            else
            {
                relativeUrl = "/" + normalized;
            }

            if (!string.IsNullOrWhiteSpace(targetHostname))
            {
                return NormalizeHostname(targetHostname) + relativeUrl;
            }

            return relativeUrl;
        }

        public static string GetAbsoluteOrRelativeUrl(string relativePath, string targetHostname = null)
        {
            var normalized = "/" + (relativePath ?? string.Empty).Replace('\\', '/').TrimStart('/');

            if (!string.IsNullOrWhiteSpace(targetHostname))
            {
                return NormalizeHostname(targetHostname) + normalized;
            }

            return normalized;
        }

        public static string NormalizeHostname(string targetHostname)
        {
            var trimmed = targetHostname.Trim().TrimEnd('/');

            if (!trimmed.StartsWith("http://", StringComparison.OrdinalIgnoreCase) &&
                !trimmed.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                trimmed = "https://" + trimmed;
            }

            return trimmed;
        }

        public static string FormatSectionTitle(string segment)
        {
            if (string.IsNullOrWhiteSpace(segment))
            {
                return "Pages";
            }

            var words = segment
                .Replace('-', ' ')
                .Replace('_', ' ')
                .Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(w => CultureInfo.InvariantCulture.TextInfo.ToTitleCase(w.ToLowerInvariant()));

            var title = string.Join(" ", words);
            return string.IsNullOrWhiteSpace(title) ? "Pages" : title;
        }

        private static string ConvertUrlPathToMarkdownPath(string path)
        {
            if (string.IsNullOrWhiteSpace(path) || path == "/")
            {
                return "/index.md";
            }

            var normalized = path.StartsWith("/") ? path : "/" + path;

            if (normalized.EndsWith(".md", StringComparison.OrdinalIgnoreCase))
            {
                return normalized;
            }

            if (normalized.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
            {
                return normalized.Substring(0, normalized.Length - 5) + ".md";
            }

            if (normalized.EndsWith(".htm", StringComparison.OrdinalIgnoreCase))
            {
                return normalized.Substring(0, normalized.Length - 4) + ".md";
            }

            return normalized.TrimEnd('/') + "/index.md";
        }
    }
}
