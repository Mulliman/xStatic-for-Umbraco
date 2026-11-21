using HtmlAgilityPack;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace XStatic.Core.Generator.Markdown
{
    public class HtmlToMarkdownConverter : IHtmlToMarkdownConverter
    {
        private static readonly HashSet<string> AlwaysStripTags = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "script", "style", "noscript", "template", "svg", "iframe", "head", "canvas", "object", "embed"
        };

        private static readonly HashSet<string> ChromeTags = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "nav", "aside", "footer", "form"
        };

        private static readonly HashSet<string> ChromeRoles = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "navigation", "banner", "contentinfo", "complementary", "search"
        };

        private static readonly Regex MultipleSpacesRegex = new Regex(@"[ \t\r\n]+", RegexOptions.Compiled);
        private static readonly Regex ExcessNewlinesRegex = new Regex(@"\n{3,}", RegexOptions.Compiled);
        private static readonly Regex TrailingSpacesPerLineRegex = new Regex(@"[ \t]+\n", RegexOptions.Compiled);
        private static readonly Regex CodeLanguageRegex = new Regex(@"(?:language|lang)-([a-zA-Z0-9_+#.-]+)", RegexOptions.Compiled | RegexOptions.IgnoreCase);

        public HtmlPageMetadata ExtractMetadata(string html)
        {
            var metadata = new HtmlPageMetadata();

            if (string.IsNullOrWhiteSpace(html))
            {
                return metadata;
            }

            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            var titleNode = doc.DocumentNode.SelectSingleNode("//head/title")
                ?? doc.DocumentNode.SelectSingleNode("//title")
                ?? doc.DocumentNode.SelectSingleNode("//h1");

            if (titleNode != null)
            {
                metadata.Title = NormalizeInlineWhitespace(HtmlEntity.DeEntitize(titleNode.InnerText));
            }

            var metaNodes = doc.DocumentNode.SelectNodes("//meta");
            if (metaNodes != null)
            {
                foreach (var meta in metaNodes)
                {
                    var name = meta.GetAttributeValue("name", string.Empty);
                    var property = meta.GetAttributeValue("property", string.Empty);
                    var content = meta.GetAttributeValue("content", null);

                    if (string.IsNullOrWhiteSpace(content))
                    {
                        continue;
                    }

                    var decoded = NormalizeInlineWhitespace(HtmlEntity.DeEntitize(content));

                    if (string.IsNullOrEmpty(metadata.Description) &&
                        string.Equals(name, "description", StringComparison.OrdinalIgnoreCase))
                    {
                        metadata.Description = decoded;
                    }
                    else if (string.IsNullOrEmpty(metadata.Description) &&
                        string.Equals(property, "og:description", StringComparison.OrdinalIgnoreCase))
                    {
                        metadata.Description = decoded;
                    }

                    if (string.IsNullOrEmpty(metadata.OgUrl) &&
                        string.Equals(property, "og:url", StringComparison.OrdinalIgnoreCase))
                    {
                        metadata.OgUrl = decoded;
                    }
                }
            }

            var canonicalNode = doc.DocumentNode
                .SelectNodes("//link[@rel and @href]")
                ?.FirstOrDefault(n => HasRelToken(n.GetAttributeValue("rel", string.Empty), "canonical"));

            if (canonicalNode != null)
            {
                metadata.CanonicalUrl = HtmlEntity.DeEntitize(canonicalNode.GetAttributeValue("href", string.Empty)).Trim();
            }

            var jsonLdNodes = doc.DocumentNode
                .SelectNodes("//script[@type]")
                ?.Where(n => string.Equals(n.GetAttributeValue("type", string.Empty).Trim(), "application/ld+json", StringComparison.OrdinalIgnoreCase));

            if (jsonLdNodes != null)
            {
                foreach (var node in jsonLdNodes)
                {
                    if (!string.IsNullOrWhiteSpace(node.InnerText))
                    {
                        metadata.JsonLdBlocks.Add(node.InnerText.Trim());
                    }
                }
            }

            return metadata;
        }

        public string Convert(string html, HtmlToMarkdownOptions options = null)
        {
            if (string.IsNullOrWhiteSpace(html))
            {
                return string.Empty;
            }

            options ??= new HtmlToMarkdownOptions();

            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            var metadata = ExtractMetadata(html);
            var contentRoot = FindContentRoot(doc, options);

            if (contentRoot == null)
            {
                return string.Empty;
            }

            var sb = new StringBuilder();
            RenderChildren(contentRoot, sb, options, listDepth: 0, insidePrimaryContent: IsPrimaryContentNode(contentRoot));

            var markdown = NormalizeMarkdown(sb.ToString());

            if (options.EnsureTitleHeading &&
                !string.IsNullOrWhiteSpace(metadata.Title) &&
                !StartsWithH1(markdown))
            {
                markdown = string.IsNullOrEmpty(markdown)
                    ? $"# {metadata.Title}"
                    : $"# {metadata.Title}\n\n{markdown}";
            }

            return markdown;
        }

        private static HtmlNode FindContentRoot(HtmlDocument doc, HtmlToMarkdownOptions options)
        {
            if (!string.IsNullOrWhiteSpace(options.ContentSelector))
            {
                var selectors = options.ContentSelector
                    .Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => s.Trim())
                    .Where(s => !string.IsNullOrEmpty(s));

                foreach (var selector in selectors)
                {
                    var matched = SelectBySimpleSelector(doc.DocumentNode, selector);
                    if (matched != null)
                    {
                        return matched;
                    }
                }
            }

            var main = doc.DocumentNode.SelectSingleNode("//main")
                ?? doc.DocumentNode.SelectSingleNode("//*[@role='main']")
                ?? doc.DocumentNode.SelectSingleNode("//article");

            if (main != null)
            {
                return main;
            }

            return doc.DocumentNode.SelectSingleNode("//body") ?? doc.DocumentNode;
        }

        private static HtmlNode SelectBySimpleSelector(HtmlNode root, string selector)
        {
            if (selector.StartsWith("//"))
            {
                return root.SelectSingleNode(selector);
            }

            if (selector.StartsWith("#"))
            {
                var id = selector.Substring(1);
                return root.SelectSingleNode($"//*[@id='{id}']");
            }

            if (selector.StartsWith("."))
            {
                var cls = selector.Substring(1);
                return root.SelectSingleNode($"//*[contains(concat(' ', normalize-space(@class), ' '), ' {cls} ')]");
            }

            return root.SelectSingleNode($"//{selector}");
        }

        private static bool IsPrimaryContentNode(HtmlNode node)
        {
            return string.Equals(node.Name, "main", StringComparison.OrdinalIgnoreCase)
                || string.Equals(node.Name, "article", StringComparison.OrdinalIgnoreCase)
                || string.Equals(node.GetAttributeValue("role", string.Empty), "main", StringComparison.OrdinalIgnoreCase);
        }

        private static bool ShouldSkipNode(HtmlNode node, HtmlToMarkdownOptions options, bool insidePrimaryContent)
        {
            if (node.NodeType == HtmlNodeType.Comment)
            {
                return true;
            }

            if (node.NodeType != HtmlNodeType.Element)
            {
                return false;
            }

            if (AlwaysStripTags.Contains(node.Name))
            {
                return true;
            }

            if (!options.StripNavigationChrome)
            {
                return false;
            }

            if (ChromeTags.Contains(node.Name))
            {
                return true;
            }

            if (string.Equals(node.Name, "header", StringComparison.OrdinalIgnoreCase))
            {
                // Keep <header> if it sits inside <main>/<article> and holds headings (e.g. article header),
                // but strip top-level site chrome <header>.
                if (!insidePrimaryContent || node.SelectSingleNode(".//h1|.//h2") == null)
                {
                    return true;
                }
            }

            if (string.Equals(node.GetAttributeValue("aria-hidden", string.Empty), "true", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (node.Attributes["hidden"] != null)
            {
                return true;
            }

            var role = node.GetAttributeValue("role", string.Empty).Trim();
            if (!string.IsNullOrEmpty(role) && ChromeRoles.Contains(role))
            {
                return true;
            }

            return false;
        }

        private void RenderChildren(HtmlNode parent, StringBuilder sb, HtmlToMarkdownOptions options, int listDepth, bool insidePrimaryContent)
        {
            foreach (var child in parent.ChildNodes)
            {
                RenderNode(child, sb, options, listDepth, insidePrimaryContent);
            }
        }

        private void RenderNode(HtmlNode node, StringBuilder sb, HtmlToMarkdownOptions options, int listDepth, bool insidePrimaryContent)
        {
            if (ShouldSkipNode(node, options, insidePrimaryContent))
            {
                return;
            }

            if (node.NodeType == HtmlNodeType.Text)
            {
                var text = HtmlEntity.DeEntitize(node.InnerText);
                var normalized = NormalizeInlineWhitespacePreserveEdges(text);
                if (!string.IsNullOrEmpty(normalized))
                {
                    AppendInlineText(sb, normalized);
                }
                return;
            }

            if (node.NodeType != HtmlNodeType.Element)
            {
                return;
            }

            var tag = node.Name.ToLowerInvariant();
            var inPrimary = insidePrimaryContent || IsPrimaryContentNode(node);

            switch (tag)
            {
                case "h1":
                case "h2":
                case "h3":
                case "h4":
                case "h5":
                case "h6":
                {
                    int level = tag[1] - '0';
                    var headingText = RenderInlineToString(node, options, inPrimary).Trim();
                    if (!string.IsNullOrEmpty(headingText))
                    {
                        EnsureBlankLine(sb);
                        sb.Append(new string('#', level)).Append(' ').Append(headingText).Append("\n\n");
                    }
                    break;
                }

                case "p":
                {
                    var paragraph = RenderInlineToString(node, options, inPrimary).Trim();
                    if (!string.IsNullOrEmpty(paragraph))
                    {
                        EnsureBlankLine(sb);
                        sb.Append(paragraph).Append("\n\n");
                    }
                    break;
                }

                case "br":
                    sb.Append("\n");
                    break;

                case "hr":
                    EnsureBlankLine(sb);
                    sb.Append("---\n\n");
                    break;

                case "strong":
                case "b":
                {
                    var inner = RenderInlineToString(node, options, inPrimary).Trim();
                    if (!string.IsNullOrEmpty(inner))
                    {
                        AppendInlineText(sb, $"**{inner}**");
                    }
                    break;
                }

                case "em":
                case "i":
                {
                    var inner = RenderInlineToString(node, options, inPrimary).Trim();
                    if (!string.IsNullOrEmpty(inner))
                    {
                        AppendInlineText(sb, $"*{inner}*");
                    }
                    break;
                }

                case "del":
                case "s":
                {
                    var inner = RenderInlineToString(node, options, inPrimary).Trim();
                    if (!string.IsNullOrEmpty(inner))
                    {
                        AppendInlineText(sb, $"~~{inner}~~");
                    }
                    break;
                }

                case "code":
                {
                    var codeText = HtmlEntity.DeEntitize(node.InnerText);
                    if (!string.IsNullOrEmpty(codeText))
                    {
                        var fence = codeText.Contains("`") ? "``" : "`";
                        AppendInlineText(sb, $"{fence}{codeText}{fence}");
                    }
                    break;
                }

                case "pre":
                {
                    var codeChild = node.SelectSingleNode("./code");
                    var rawCode = HtmlEntity.DeEntitize((codeChild ?? node).InnerText)
                        .Replace("\r\n", "\n")
                        .Trim('\n');

                    var language = ExtractCodeLanguage(codeChild) ?? ExtractCodeLanguage(node) ?? string.Empty;
                    var fence = rawCode.Contains("```") ? "~~~~" : "```";

                    EnsureBlankLine(sb);
                    sb.Append(fence).Append(language).Append('\n');
                    sb.Append(rawCode).Append('\n');
                    sb.Append(fence).Append("\n\n");
                    break;
                }

                case "a":
                {
                    var href = HtmlEntity.DeEntitize(node.GetAttributeValue("href", string.Empty)).Trim();
                    var linkText = RenderInlineToString(node, options, inPrimary).Trim();

                    if (string.IsNullOrEmpty(linkText) && string.IsNullOrEmpty(href))
                    {
                        break;
                    }

                    if (string.IsNullOrEmpty(href) ||
                        href == "#" ||
                        href.StartsWith("javascript:", StringComparison.OrdinalIgnoreCase))
                    {
                        if (!string.IsNullOrEmpty(linkText))
                        {
                            AppendInlineText(sb, linkText);
                        }
                    }
                    else
                    {
                        var label = string.IsNullOrEmpty(linkText) ? href : linkText;
                        AppendInlineText(sb, $"[{label}]({href})");
                    }
                    break;
                }

                case "img":
                {
                    var src = HtmlEntity.DeEntitize(node.GetAttributeValue("src", string.Empty)).Trim();
                    var alt = HtmlEntity.DeEntitize(node.GetAttributeValue("alt", string.Empty)).Trim();
                    if (!string.IsNullOrEmpty(src))
                    {
                        AppendInlineText(sb, $"![{alt}]({src})");
                    }
                    break;
                }

                case "blockquote":
                {
                    var innerSb = new StringBuilder();
                    RenderChildren(node, innerSb, options, listDepth, inPrimary);
                    var quoteBody = NormalizeMarkdown(innerSb.ToString());
                    if (!string.IsNullOrEmpty(quoteBody))
                    {
                        EnsureBlankLine(sb);
                        foreach (var line in quoteBody.Split('\n'))
                        {
                            sb.Append(string.IsNullOrWhiteSpace(line) ? ">\n" : $"> {line}\n");
                        }
                        sb.Append('\n');
                    }
                    break;
                }

                case "ul":
                case "ol":
                {
                    RenderList(node, sb, options, listDepth, ordered: tag == "ol", inPrimary);
                    break;
                }

                case "table":
                {
                    RenderTable(node, sb, options, inPrimary);
                    break;
                }

                case "div":
                case "section":
                case "article":
                case "main":
                case "figure":
                case "figcaption":
                case "header":
                case "details":
                case "summary":
                {
                    EnsureBlockBreak(sb);
                    RenderChildren(node, sb, options, listDepth, inPrimary);
                    EnsureBlockBreak(sb);
                    break;
                }

                default:
                    RenderChildren(node, sb, options, listDepth, inPrimary);
                    break;
            }
        }

        private void RenderList(HtmlNode listNode, StringBuilder sb, HtmlToMarkdownOptions options, int listDepth, bool ordered, bool insidePrimaryContent)
        {
            if (listDepth == 0)
            {
                EnsureBlankLine(sb);
            }
            else if (sb.Length > 0 && sb[sb.Length - 1] != '\n')
            {
                sb.Append('\n');
            }

            var indent = new string(' ', listDepth * 2);
            int index = 1;

            foreach (var li in listNode.ChildNodes.Where(n => string.Equals(n.Name, "li", StringComparison.OrdinalIgnoreCase)))
            {
                var prefix = ordered ? $"{index}. " : "- ";
                index++;

                var itemInlineSb = new StringBuilder();
                var nestedLists = new List<HtmlNode>();

                foreach (var child in li.ChildNodes)
                {
                    if (child.NodeType == HtmlNodeType.Element &&
                        (string.Equals(child.Name, "ul", StringComparison.OrdinalIgnoreCase) ||
                         string.Equals(child.Name, "ol", StringComparison.OrdinalIgnoreCase)))
                    {
                        nestedLists.Add(child);
                    }
                    else
                    {
                        RenderNode(child, itemInlineSb, options, listDepth + 1, insidePrimaryContent);
                    }
                }

                var itemText = NormalizeMarkdown(itemInlineSb.ToString()).Replace("\n\n", "\n");
                if (!string.IsNullOrEmpty(itemText))
                {
                    var lines = itemText.Split('\n');
                    sb.Append(indent).Append(prefix).Append(lines[0]).Append('\n');
                    for (int i = 1; i < lines.Length; i++)
                    {
                        sb.Append(indent).Append("  ").Append(lines[i]).Append('\n');
                    }
                }

                foreach (var nested in nestedLists)
                {
                    RenderList(nested, sb, options, listDepth + 1, ordered: string.Equals(nested.Name, "ol", StringComparison.OrdinalIgnoreCase), insidePrimaryContent);
                }
            }

            if (listDepth == 0)
            {
                sb.Append('\n');
            }
        }

        private void RenderTable(HtmlNode tableNode, StringBuilder sb, HtmlToMarkdownOptions options, bool insidePrimaryContent)
        {
            var rows = tableNode.SelectNodes(".//tr");
            if (rows == null || rows.Count == 0)
            {
                return;
            }

            var parsedRows = new List<List<string>>();
            foreach (var row in rows)
            {
                var cells = row.ChildNodes
                    .Where(n => n.NodeType == HtmlNodeType.Element &&
                                (string.Equals(n.Name, "th", StringComparison.OrdinalIgnoreCase) ||
                                 string.Equals(n.Name, "td", StringComparison.OrdinalIgnoreCase)))
                    .Select(c => RenderInlineToString(c, options, insidePrimaryContent)
                        .Replace("\n", " ")
                        .Replace("|", "\\|")
                        .Trim())
                    .ToList();

                if (cells.Count > 0)
                {
                    parsedRows.Add(cells);
                }
            }

            if (parsedRows.Count == 0)
            {
                return;
            }

            var columnCount = parsedRows.Max(r => r.Count);
            EnsureBlankLine(sb);

            for (int r = 0; r < parsedRows.Count; r++)
            {
                var row = parsedRows[r];
                sb.Append('|');
                for (int c = 0; c < columnCount; c++)
                {
                    var cell = c < row.Count ? row[c] : string.Empty;
                    sb.Append(' ').Append(cell).Append(" |");
                }
                sb.Append('\n');

                if (r == 0)
                {
                    sb.Append('|');
                    for (int c = 0; c < columnCount; c++)
                    {
                        sb.Append(" --- |");
                    }
                    sb.Append('\n');
                }
            }

            sb.Append('\n');
        }

        private string RenderInlineToString(HtmlNode node, HtmlToMarkdownOptions options, bool insidePrimaryContent)
        {
            var inner = new StringBuilder();
            RenderChildren(node, inner, options, listDepth: 0, insidePrimaryContent);
            return inner.ToString();
        }

        private static string ExtractCodeLanguage(HtmlNode node)
        {
            if (node == null)
            {
                return null;
            }

            var cls = node.GetAttributeValue("class", string.Empty);
            if (string.IsNullOrWhiteSpace(cls))
            {
                return null;
            }

            var match = CodeLanguageRegex.Match(cls);
            return match.Success ? match.Groups[1].Value : null;
        }

        private static bool HasRelToken(string relValue, string expectedToken)
        {
            return relValue
                .Split(new[] { ' ', '\t', '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                .Any(t => string.Equals(t, expectedToken, StringComparison.OrdinalIgnoreCase));
        }

        private static bool StartsWithH1(string markdown)
        {
            return !string.IsNullOrEmpty(markdown) && markdown.StartsWith("# ", StringComparison.Ordinal);
        }

        private static string NormalizeInlineWhitespace(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return string.Empty;
            }

            return MultipleSpacesRegex.Replace(text, " ").Trim();
        }

        private static string NormalizeInlineWhitespacePreserveEdges(string text)
        {
            if (string.IsNullOrEmpty(text))
            {
                return string.Empty;
            }

            if (string.IsNullOrWhiteSpace(text))
            {
                return " ";
            }

            return MultipleSpacesRegex.Replace(text, " ");
        }

        private static void AppendInlineText(StringBuilder sb, string text)
        {
            if (string.IsNullOrEmpty(text))
            {
                return;
            }

            if (text == " ")
            {
                if (sb.Length > 0 && sb[sb.Length - 1] != ' ' && sb[sb.Length - 1] != '\n')
                {
                    sb.Append(' ');
                }
                return;
            }

            if (sb.Length > 0 && text[0] == ' ' && (sb[sb.Length - 1] == ' ' || sb[sb.Length - 1] == '\n'))
            {
                text = text.TrimStart(' ');
            }

            sb.Append(text);
        }

        private static void EnsureBlankLine(StringBuilder sb)
        {
            if (sb.Length == 0)
            {
                return;
            }

            if (sb.Length >= 2 && sb[sb.Length - 1] == '\n' && sb[sb.Length - 2] == '\n')
            {
                return;
            }

            if (sb[sb.Length - 1] == '\n')
            {
                sb.Append('\n');
            }
            else
            {
                sb.Append("\n\n");
            }
        }

        private static void EnsureBlockBreak(StringBuilder sb)
        {
            if (sb.Length > 0 && sb[sb.Length - 1] != '\n')
            {
                sb.Append('\n');
            }
        }

        private static string NormalizeMarkdown(string raw)
        {
            if (string.IsNullOrWhiteSpace(raw))
            {
                return string.Empty;
            }

            var normalized = raw.Replace("\r\n", "\n");
            normalized = TrailingSpacesPerLineRegex.Replace(normalized, "\n");
            normalized = ExcessNewlinesRegex.Replace(normalized, "\n\n");
            return normalized.Trim();
        }
    }
}
