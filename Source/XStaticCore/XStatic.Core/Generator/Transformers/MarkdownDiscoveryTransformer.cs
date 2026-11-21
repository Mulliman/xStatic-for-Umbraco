using HtmlAgilityPack;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Umbraco.Cms.Core.Web;
using XStatic.Core.Generator.Markdown;

namespace XStatic.Core.Generator.Transformers
{
    public class JsonLdValidationResult
    {
        public int Index { get; set; }

        public bool IsValid { get; set; }

        public string Error { get; set; }
    }

    /// <summary>
    /// Injects a Markdown discovery &lt;link rel="alternate" type="text/markdown" href="..."&gt; tag into HTML &lt;head&gt;
    /// while preserving existing canonical and JSON-LD metadata intact.
    /// </summary>
    public class MarkdownDiscoveryTransformer : ITransformer
    {
        private static readonly Regex ClosingHeadRegex = new Regex(@"</head\s*>", RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private readonly string _targetHostname;
        private readonly string _pageUrl;
        private readonly bool _ensureCanonicalFromOgUrl;

        public MarkdownDiscoveryTransformer(
            string targetHostname = null,
            string pageUrl = null,
            bool ensureCanonicalFromOgUrl = false)
        {
            _targetHostname = targetHostname;
            _pageUrl = pageUrl;
            _ensureCanonicalFromOgUrl = ensureCanonicalFromOgUrl;
        }

        public string Transform(string input, IUmbracoContext context)
        {
            if (string.IsNullOrEmpty(input))
            {
                return input;
            }

            var closingHeadMatch = ClosingHeadRegex.Match(input);
            if (!closingHeadMatch.Success)
            {
                return input;
            }

            var doc = new HtmlDocument();
            doc.LoadHtml(input);

            var hasMarkdownAlternate = HasMarkdownAlternateLink(doc);
            var canonicalUrl = GetCanonicalUrl(doc);
            var ogUrl = GetOgUrl(doc);

            var tagsToInject = new StringBuilder();

            if (_ensureCanonicalFromOgUrl &&
                string.IsNullOrWhiteSpace(canonicalUrl) &&
                !string.IsNullOrWhiteSpace(ogUrl))
            {
                var canonicalHref = ResolveUrlWithHostname(ogUrl, _targetHostname);
                tagsToInject.Append($"<link rel=\"canonical\" href=\"{WebUtility.HtmlEncode(canonicalHref)}\" />\n");
                canonicalUrl = canonicalHref;
            }

            if (!hasMarkdownAlternate)
            {
                var sourceUrl = !string.IsNullOrWhiteSpace(_pageUrl)
                    ? _pageUrl
                    : !string.IsNullOrWhiteSpace(canonicalUrl)
                        ? canonicalUrl
                        : ogUrl;

                var markdownHref = MarkdownPathHelper.GetCompanionMarkdownHref(sourceUrl, _targetHostname);
                tagsToInject.Append($"<link rel=\"alternate\" type=\"text/markdown\" href=\"{WebUtility.HtmlEncode(markdownHref)}\" />\n");
            }

            if (tagsToInject.Length == 0)
            {
                return input;
            }

            // Minimal targeted insertion preserves original DOCTYPE, formatting, canonical tags, and JSON-LD byte-for-byte.
            return input.Insert(closingHeadMatch.Index, tagsToInject.ToString());
        }

        public static IReadOnlyList<JsonLdValidationResult> ValidateJsonLd(string html)
        {
            var results = new List<JsonLdValidationResult>();

            if (string.IsNullOrWhiteSpace(html))
            {
                return results;
            }

            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            var scripts = doc.DocumentNode
                .SelectNodes("//script[@type]")
                ?.Where(n => string.Equals(n.GetAttributeValue("type", string.Empty).Trim(), "application/ld+json", StringComparison.OrdinalIgnoreCase))
                .ToList();

            if (scripts == null || scripts.Count == 0)
            {
                return results;
            }

            for (int i = 0; i < scripts.Count; i++)
            {
                var content = scripts[i].InnerText?.Trim();
                if (string.IsNullOrEmpty(content))
                {
                    results.Add(new JsonLdValidationResult
                    {
                        Index = i,
                        IsValid = false,
                        Error = "Empty JSON-LD script block."
                    });
                    continue;
                }

                try
                {
                    using var _ = JsonDocument.Parse(content);
                    results.Add(new JsonLdValidationResult
                    {
                        Index = i,
                        IsValid = true
                    });
                }
                catch (JsonException ex)
                {
                    results.Add(new JsonLdValidationResult
                    {
                        Index = i,
                        IsValid = false,
                        Error = ex.Message
                    });
                }
            }

            return results;
        }

        private static bool HasMarkdownAlternateLink(HtmlDocument doc)
        {
            var links = doc.DocumentNode.SelectNodes("//head//link[@rel and @type]")
                ?? doc.DocumentNode.SelectNodes("//link[@rel and @type]");

            if (links == null)
            {
                return false;
            }

            foreach (var link in links)
            {
                var rel = link.GetAttributeValue("rel", string.Empty);
                var type = link.GetAttributeValue("type", string.Empty).Trim();

                if (HasToken(rel, "alternate") &&
                    string.Equals(type, "text/markdown", StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }

            return false;
        }

        private static string GetCanonicalUrl(HtmlDocument doc)
        {
            var canonical = doc.DocumentNode
                .SelectNodes("//link[@rel and @href]")
                ?.FirstOrDefault(n => HasToken(n.GetAttributeValue("rel", string.Empty), "canonical"));

            var href = canonical?.GetAttributeValue("href", null);
            return string.IsNullOrWhiteSpace(href) ? null : HtmlEntity.DeEntitize(href).Trim();
        }

        private static string GetOgUrl(HtmlDocument doc)
        {
            var og = doc.DocumentNode
                .SelectNodes("//meta[@property and @content]")
                ?.FirstOrDefault(n => string.Equals(n.GetAttributeValue("property", string.Empty).Trim(), "og:url", StringComparison.OrdinalIgnoreCase));

            var content = og?.GetAttributeValue("content", null);
            return string.IsNullOrWhiteSpace(content) ? null : HtmlEntity.DeEntitize(content).Trim();
        }

        private static string ResolveUrlWithHostname(string url, string targetHostname)
        {
            if (Uri.TryCreate(url, UriKind.Absolute, out _))
            {
                return url;
            }

            if (!string.IsNullOrWhiteSpace(targetHostname))
            {
                return MarkdownPathHelper.NormalizeHostname(targetHostname) + "/" + url.TrimStart('/');
            }

            return url;
        }

        private static bool HasToken(string attributeValue, string token)
        {
            return attributeValue
                .Split(new[] { ' ', '\t', '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                .Any(t => string.Equals(t, token, StringComparison.OrdinalIgnoreCase));
        }
    }
}
