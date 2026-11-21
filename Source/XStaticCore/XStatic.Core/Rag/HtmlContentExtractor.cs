using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.RegularExpressions;

namespace XStatic.Core.Rag
{
    public interface IHtmlContentExtractor
    {
        RagPageDocument Extract(string html, string url, string relativePath, RagPageMetadata metadata = null);
    }

    public class HtmlContentExtractor : IHtmlContentExtractor
    {
        private static readonly Regex CommentRegex = new Regex(@"<!--[\s\S]*?-->", RegexOptions.Compiled);
        private static readonly Regex StripNoiseBlocksRegex = new Regex(
            @"<(script|style|noscript|template|svg|iframe)\b[^>]*>[\s\S]*?</\1>",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);
        private static readonly Regex StripChromeBlocksRegex = new Regex(
            @"<(nav|footer|aside)\b[^>]*>[\s\S]*?</\1>",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);
        private static readonly Regex TitleRegex = new Regex(
            @"<title\b[^>]*>([\s\S]*?)</title>",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);
        private static readonly Regex HtmlLangRegex = new Regex(
            @"<html\b[^>]*\blang\s*=\s*[""']([^""']+)[""']",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);
        private static readonly Regex MetaTagRegex = new Regex(
            @"<meta\b[^>]*>",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);
        private static readonly Regex AttributeRegex = new Regex(
            @"([a-zA-Z0-9_:-]+)\s*=\s*(?:""([^""]*)""|'([^']*)')",
            RegexOptions.Compiled);
        private static readonly Regex MainRegex = new Regex(
            @"<main\b[^>]*>([\s\S]*?)</main>",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);
        private static readonly Regex ArticleRegex = new Regex(
            @"<article\b[^>]*>([\s\S]*?)</article>",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);
        private static readonly Regex BodyRegex = new Regex(
            @"<body\b[^>]*>([\s\S]*?)</body>",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);
        private static readonly Regex HeadingRegex = new Regex(
            @"<h([1-6])\b[^>]*>([\s\S]*?)</h\1>",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);
        private static readonly Regex BrRegex = new Regex(
            @"<br\s*/?>",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);
        private static readonly Regex BlockEndRegex = new Regex(
            @"</(?:p|div|li|tr|blockquote|pre|section|article|header|dt|dd|figcaption|table|ul|ol)>",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);
        private static readonly Regex AnyTagRegex = new Regex(
            @"<[^>]+>",
            RegexOptions.Compiled);
        private static readonly Regex HorizontalWhitespaceRegex = new Regex(
            @"[^\S\r\n]+",
            RegexOptions.Compiled);
        private static readonly Regex MultiNewlineRegex = new Regex(
            @"\n{3,}",
            RegexOptions.Compiled);

        public RagPageDocument Extract(string html, string url, string relativePath, RagPageMetadata metadata = null)
        {
            var document = new RagPageDocument
            {
                Url = url ?? string.Empty,
                RelativePath = relativePath ?? string.Empty
            };

            if (!string.IsNullOrWhiteSpace(html))
            {
                var withoutComments = CommentRegex.Replace(html, string.Empty);

                var metaValues = ExtractMetaTags(withoutComments);

                var titleMatch = TitleRegex.Match(withoutComments);
                if (titleMatch.Success)
                {
                    document.Title = CleanInlineText(titleMatch.Groups[1].Value);
                }
                else if (metaValues.TryGetValue("og:title", out var ogTitle))
                {
                    document.Title = ogTitle;
                }

                if (metaValues.TryGetValue("description", out var description))
                {
                    document.Description = description;
                }
                else if (metaValues.TryGetValue("og:description", out var ogDescription))
                {
                    document.Description = ogDescription;
                }

                if (metaValues.TryGetValue("article:modified_time", out var modifiedTime) &&
                    DateTimeOffset.TryParse(modifiedTime, out var parsedModified))
                {
                    document.LastModified = parsedModified;
                }
                else if (metaValues.TryGetValue("last-modified", out var lastModifiedMeta) &&
                    DateTimeOffset.TryParse(lastModifiedMeta, out var parsedLastModified))
                {
                    document.LastModified = parsedLastModified;
                }

                var langMatch = HtmlLangRegex.Match(withoutComments);
                if (langMatch.Success)
                {
                    document.Culture = langMatch.Groups[1].Value.Trim();
                }

                var cleaned = StripNoiseBlocksRegex.Replace(withoutComments, string.Empty);
                var scopedHtml = SelectPrimaryContent(cleaned);
                scopedHtml = StripChromeBlocksRegex.Replace(scopedHtml, string.Empty);

                ExtractSections(scopedHtml, document);

                if (string.IsNullOrWhiteSpace(document.Title) && document.Headings.Count > 0)
                {
                    document.Title = document.Headings[0];
                }
            }

            ApplyMetadata(document, metadata);

            return document;
        }

        private static string SelectPrimaryContent(string html)
        {
            var mainMatch = MainRegex.Match(html);
            if (mainMatch.Success)
            {
                return mainMatch.Groups[1].Value;
            }

            var articleMatch = ArticleRegex.Match(html);
            if (articleMatch.Success)
            {
                return articleMatch.Groups[1].Value;
            }

            var bodyMatch = BodyRegex.Match(html);
            if (bodyMatch.Success)
            {
                return bodyMatch.Groups[1].Value;
            }

            return html;
        }

        private static void ExtractSections(string html, RagPageDocument document)
        {
            var headingMatches = HeadingRegex.Matches(html);
            if (headingMatches.Count == 0)
            {
                var bodyText = HtmlToCleanText(html);
                if (!string.IsNullOrWhiteSpace(bodyText))
                {
                    document.Sections.Add(new RagSection
                    {
                        Heading = null,
                        HeadingLevel = 0,
                        HeadingPath = new List<string>(),
                        Content = bodyText
                    });
                }

                return;
            }

            var headingStack = new List<(int Level, string Text)>();
            var firstHeadingIndex = headingMatches[0].Index;
            if (firstHeadingIndex > 0)
            {
                var introHtml = html.Substring(0, firstHeadingIndex);
                var introText = HtmlToCleanText(introHtml);
                if (!string.IsNullOrWhiteSpace(introText))
                {
                    document.Sections.Add(new RagSection
                    {
                        Heading = null,
                        HeadingLevel = 0,
                        HeadingPath = new List<string>(),
                        Content = introText
                    });
                }
            }

            for (var i = 0; i < headingMatches.Count; i++)
            {
                var match = headingMatches[i];
                var level = int.Parse(match.Groups[1].Value);
                var headingText = CleanInlineText(match.Groups[2].Value);

                if (!string.IsNullOrWhiteSpace(headingText))
                {
                    document.Headings.Add(headingText);

                    while (headingStack.Count > 0 && headingStack[headingStack.Count - 1].Level >= level)
                    {
                        headingStack.RemoveAt(headingStack.Count - 1);
                    }

                    headingStack.Add((level, headingText));
                }

                var contentStart = match.Index + match.Length;
                var contentEnd = i + 1 < headingMatches.Count ? headingMatches[i + 1].Index : html.Length;
                var sectionHtml = contentEnd > contentStart
                    ? html.Substring(contentStart, contentEnd - contentStart)
                    : string.Empty;

                var sectionText = HtmlToCleanText(sectionHtml);
                if (!string.IsNullOrWhiteSpace(sectionText))
                {
                    document.Sections.Add(new RagSection
                    {
                        Heading = string.IsNullOrWhiteSpace(headingText) ? null : headingText,
                        HeadingLevel = level,
                        HeadingPath = headingStack.Select(h => h.Text).ToList(),
                        Content = sectionText
                    });
                }
            }
        }

        private static Dictionary<string, string> ExtractMetaTags(string html)
        {
            var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            foreach (Match tagMatch in MetaTagRegex.Matches(html))
            {
                var attrs = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                foreach (Match attrMatch in AttributeRegex.Matches(tagMatch.Value))
                {
                    var key = attrMatch.Groups[1].Value;
                    var val = attrMatch.Groups[2].Success ? attrMatch.Groups[2].Value : attrMatch.Groups[3].Value;
                    attrs[key] = WebUtility.HtmlDecode(val).Trim();
                }

                if (!attrs.TryGetValue("content", out var content) || string.IsNullOrWhiteSpace(content))
                {
                    continue;
                }

                if (attrs.TryGetValue("name", out var name) && !string.IsNullOrWhiteSpace(name))
                {
                    result[name] = content;
                }
                else if (attrs.TryGetValue("property", out var property) && !string.IsNullOrWhiteSpace(property))
                {
                    result[property] = content;
                }
            }

            return result;
        }

        private static void ApplyMetadata(RagPageDocument document, RagPageMetadata metadata)
        {
            if (metadata == null)
            {
                return;
            }

            if (!string.IsNullOrWhiteSpace(metadata.DocType))
            {
                document.DocType = metadata.DocType;
            }

            if (metadata.LastModified.HasValue)
            {
                document.LastModified = metadata.LastModified;
            }

            if (!string.IsNullOrWhiteSpace(metadata.Culture))
            {
                document.Culture = metadata.Culture;
            }

            if (metadata.CustomProperties != null)
            {
                foreach (var kvp in metadata.CustomProperties)
                {
                    if (!string.IsNullOrWhiteSpace(kvp.Key) && kvp.Value != null)
                    {
                        document.CustomProperties[kvp.Key] = kvp.Value;
                    }
                }
            }
        }

        private static string CleanInlineText(string htmlFragment)
        {
            if (string.IsNullOrWhiteSpace(htmlFragment))
            {
                return string.Empty;
            }

            var withoutTags = AnyTagRegex.Replace(htmlFragment, " ");
            var decoded = WebUtility.HtmlDecode(withoutTags);
            return Regex.Replace(decoded, @"\s+", " ").Trim();
        }

        private static string HtmlToCleanText(string htmlFragment)
        {
            if (string.IsNullOrWhiteSpace(htmlFragment))
            {
                return string.Empty;
            }

            var withBreaks = BrRegex.Replace(htmlFragment, "\n");
            withBreaks = BlockEndRegex.Replace(withBreaks, "\n\n");
            var withoutTags = AnyTagRegex.Replace(withBreaks, " ");
            var decoded = WebUtility.HtmlDecode(withoutTags)
                .Replace("\r\n", "\n")
                .Replace("\r", "\n");

            var lines = decoded
                .Split('\n')
                .Select(line => HorizontalWhitespaceRegex.Replace(line, " ").Trim())
                .ToArray();

            var joined = string.Join("\n", lines);
            return MultiNewlineRegex.Replace(joined, "\n\n").Trim();
        }
    }
}
