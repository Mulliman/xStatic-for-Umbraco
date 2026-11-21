using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using XStatic.Core.Actions.FileActions;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.Markdown;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Repositories;

namespace XStatic.Core.Actions
{
    public class GenerateLlmsTxtFields
    {
        public const string SiteTitle = "SiteTitle";
        public const string SiteDescription = "SiteDescription";
        public const string GenerateFullFile = "GenerateFullFile";
        public const string GenerateCompanionMarkdown = "GenerateCompanionMarkdown";
        public const string UseMarkdownLinks = "UseMarkdownLinks";
        public const string ExcludePaths = "ExcludePaths";
    }

    /// <summary>
    /// Post-generation action that compiles /llms.txt (curated Markdown site map) and optionally
    /// /llms-full.txt (bundled full-site Markdown) from the generated static site output.
    /// </summary>
    [XStaticEditableField(GenerateLlmsTxtFields.SiteTitle, UIEditors.Text)]
    [XStaticEditableField(GenerateLlmsTxtFields.SiteDescription, UIEditors.TextArea)]
    [XStaticEditableField(GenerateLlmsTxtFields.GenerateFullFile, UIEditors.Toggle)]
    [XStaticEditableField(GenerateLlmsTxtFields.GenerateCompanionMarkdown, UIEditors.Toggle)]
    [XStaticEditableField(GenerateLlmsTxtFields.UseMarkdownLinks, UIEditors.Toggle)]
    [XStaticEditableField(GenerateLlmsTxtFields.ExcludePaths, UIEditors.Text)]
    public class GenerateLlmsTxtAction : PostGenerationActionBase
    {
        private readonly ISitesRepository _sitesRepository;
        private readonly IStaticSiteStorer _staticSiteStorer;
        private readonly IHtmlToMarkdownConverter _markdownConverter;

        public override string Name => nameof(GenerateLlmsTxtAction);

        public GenerateLlmsTxtAction(
            ISitesRepository sitesRepository,
            IStaticSiteStorer staticSiteStorer,
            IHtmlToMarkdownConverter markdownConverter = null)
        {
            _sitesRepository = sitesRepository;
            _staticSiteStorer = staticSiteStorer;
            _markdownConverter = markdownConverter ?? new HtmlToMarkdownConverter();
        }

        public override async Task<XStaticResult> RunAction(int staticSiteId, Dictionary<string, string> parameters)
        {
            parameters ??= new Dictionary<string, string>();

            var siteConfig = _sitesRepository.Get<SiteConfig>(staticSiteId);
            if (siteConfig == null)
            {
                return XStaticResult.Error("Site config not found.");
            }

            var siteRoot = _staticSiteStorer.GetStorageLocationOfSite(staticSiteId);
            if (string.IsNullOrWhiteSpace(siteRoot) || !Directory.Exists(siteRoot))
            {
                return XStaticResult.Error($"Generated site directory not found for site {staticSiteId}.");
            }

            var siteTitleOverride = GetParameter(parameters, GenerateLlmsTxtFields.SiteTitle);
            var siteDescriptionOverride = GetParameter(parameters, GenerateLlmsTxtFields.SiteDescription);
            var generateFullFile = ParseBoolParameter(GetParameter(parameters, GenerateLlmsTxtFields.GenerateFullFile), defaultValue: true);
            var generateCompanionMarkdown = ParseBoolParameter(GetParameter(parameters, GenerateLlmsTxtFields.GenerateCompanionMarkdown), defaultValue: false);
            var useMarkdownLinks = ParseBoolParameter(GetParameter(parameters, GenerateLlmsTxtFields.UseMarkdownLinks), defaultValue: true);
            var excludedPrefixes = GenerateCompanionMarkdownAction.ParseExcludePaths(GetParameter(parameters, GenerateLlmsTxtFields.ExcludePaths));

            try
            {
                var pages = await CollectPages(siteStaticId: staticSiteId, siteRoot, siteConfig.TargetHostname, generateCompanionMarkdown, generateFullFile, excludedPrefixes);

                var rootPage = pages.FirstOrDefault(p => p.IsRootPage);
                var siteTitle = !string.IsNullOrWhiteSpace(siteTitleOverride)
                    ? siteTitleOverride.Trim()
                    : !string.IsNullOrWhiteSpace(siteConfig.Name)
                        ? siteConfig.Name.Trim()
                        : !string.IsNullOrWhiteSpace(rootPage?.Title)
                            ? rootPage.Title
                            : "Static Site";

                var siteDescription = !string.IsNullOrWhiteSpace(siteDescriptionOverride)
                    ? siteDescriptionOverride.Trim()
                    : rootPage?.Description;

                var llmsTxt = BuildLlmsTxt(siteTitle, siteDescription, pages, useMarkdownLinks);
                await _staticSiteStorer.StoreSiteItem(staticSiteId.ToString(), "llms.txt", llmsTxt, Encoding.UTF8);

                if (generateFullFile)
                {
                    var llmsFullTxt = BuildLlmsFullTxt(siteTitle, siteDescription, pages);
                    await _staticSiteStorer.StoreSiteItem(staticSiteId.ToString(), "llms-full.txt", llmsFullTxt, Encoding.UTF8);
                }

                return XStaticResult.Success();
            }
            catch (Exception ex)
            {
                return XStaticResult.Error("Failed to generate llms.txt files.", ex);
            }
        }

        private async Task<List<LlmsPageEntry>> CollectPages(
            int siteStaticId,
            string siteRoot,
            string targetHostname,
            bool generateCompanionMarkdown,
            bool needMarkdownBody,
            List<string> excludedPrefixes)
        {
            var htmlFiles = Directory.GetFiles(siteRoot, "*.html", SearchOption.AllDirectories)
                .Select(f => new
                {
                    FullPath = f,
                    RelativePath = Path.GetRelativePath(siteRoot, f).Replace('\\', '/')
                })
                .OrderBy(f => IsRootHtmlPath(f.RelativePath) ? 0 : 1)
                .ThenBy(f => f.RelativePath, StringComparer.OrdinalIgnoreCase)
                .ToList();

            var entries = new List<LlmsPageEntry>();

            foreach (var file in htmlFiles)
            {
                var relativePageUrl = MarkdownPathHelper.GetPageUrlFromHtmlFilePath(file.RelativePath);
                if (GenerateCompanionMarkdownAction.IsExcluded(relativePageUrl, file.RelativePath, excludedPrefixes))
                {
                    continue;
                }

                var html = await File.ReadAllTextAsync(file.FullPath, Encoding.UTF8);
                var metadata = _markdownConverter.ExtractMetadata(html);

                var markdownRelativePath = MarkdownPathHelper.GetCompanionMarkdownPath(file.RelativePath);
                var markdownFullPath = Path.Combine(siteRoot, markdownRelativePath.Replace('/', Path.DirectorySeparatorChar));
                var hasCompanionMarkdown = File.Exists(markdownFullPath);

                string markdownBody = null;

                if (hasCompanionMarkdown && needMarkdownBody)
                {
                    markdownBody = await File.ReadAllTextAsync(markdownFullPath, Encoding.UTF8);
                }
                else if (generateCompanionMarkdown || needMarkdownBody)
                {
                    markdownBody = _markdownConverter.Convert(html);

                    if (generateCompanionMarkdown && !hasCompanionMarkdown)
                    {
                        await _staticSiteStorer.StoreSiteItem(siteStaticId.ToString(), markdownRelativePath, markdownBody, Encoding.UTF8);
                        hasCompanionMarkdown = true;
                    }
                }

                var isRoot = IsRootHtmlPath(file.RelativePath);
                var title = !string.IsNullOrWhiteSpace(metadata.Title)
                    ? metadata.Title
                    : DeriveFallbackTitle(relativePageUrl, isRoot);

                entries.Add(new LlmsPageEntry
                {
                    IsRootPage = isRoot,
                    Section = DetermineSection(relativePageUrl),
                    Title = title,
                    Description = metadata.Description,
                    PageUrl = MarkdownPathHelper.GetPageUrlFromHtmlFilePath(file.RelativePath, targetHostname),
                    MarkdownUrl = MarkdownPathHelper.GetAbsoluteOrRelativeUrl(markdownRelativePath, targetHostname),
                    HasCompanionMarkdown = hasCompanionMarkdown,
                    MarkdownBody = markdownBody
                });
            }

            return entries;
        }

        private static string BuildLlmsTxt(string siteTitle, string siteDescription, List<LlmsPageEntry> pages, bool useMarkdownLinks)
        {
            var sb = new StringBuilder();
            sb.Append("# ").AppendLine(siteTitle);
            sb.AppendLine();

            if (!string.IsNullOrWhiteSpace(siteDescription))
            {
                sb.Append("> ").AppendLine(siteDescription);
                sb.AppendLine();
            }

            var grouped = pages
                .GroupBy(p => p.Section, StringComparer.OrdinalIgnoreCase)
                .OrderBy(g => string.Equals(g.Key, "Pages", StringComparison.OrdinalIgnoreCase) ? 0 : 1)
                .ThenBy(g => g.Key, StringComparer.OrdinalIgnoreCase);

            foreach (var group in grouped)
            {
                sb.Append("## ").AppendLine(group.Key);
                sb.AppendLine();

                foreach (var page in group)
                {
                    var href = (useMarkdownLinks && page.HasCompanionMarkdown) ? page.MarkdownUrl : page.PageUrl;
                    sb.Append("- [").Append(page.Title).Append("](").Append(href).Append(')');

                    if (!string.IsNullOrWhiteSpace(page.Description))
                    {
                        sb.Append(": ").Append(page.Description);
                    }

                    sb.AppendLine();
                }

                sb.AppendLine();
            }

            return sb.ToString().TrimEnd() + "\n";
        }

        private static string BuildLlmsFullTxt(string siteTitle, string siteDescription, List<LlmsPageEntry> pages)
        {
            var sb = new StringBuilder();
            sb.Append("# ").AppendLine(siteTitle);
            sb.AppendLine();

            if (!string.IsNullOrWhiteSpace(siteDescription))
            {
                sb.Append("> ").AppendLine(siteDescription);
                sb.AppendLine();
            }

            foreach (var page in pages)
            {
                sb.AppendLine("---");
                sb.AppendLine();
                sb.Append("<!-- Source: ").Append(page.PageUrl).AppendLine(" -->");

                if (!string.IsNullOrWhiteSpace(page.MarkdownBody))
                {
                    sb.AppendLine(page.MarkdownBody.Trim());
                }
                else
                {
                    sb.Append("# ").AppendLine(page.Title);
                }

                sb.AppendLine();
            }

            return sb.ToString().TrimEnd() + "\n";
        }

        private static bool IsRootHtmlPath(string relativePath)
        {
            return string.Equals(relativePath, "index.html", StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(relativePath, "index.htm", StringComparison.OrdinalIgnoreCase);
        }

        private static string DetermineSection(string relativePageUrl)
        {
            var segments = (relativePageUrl ?? string.Empty)
                .Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries);

            // Root page ("/") and single-segment top-level pages ("/about/") belong to "Pages";
            // deeper hierarchies ("/docs/getting-started/", "/blog/post-1/") group under their top-level section.
            if (segments.Length <= 1)
            {
                return "Pages";
            }

            return MarkdownPathHelper.FormatSectionTitle(segments[0]);
        }

        private static string DeriveFallbackTitle(string relativePageUrl, bool isRoot)
        {
            if (isRoot)
            {
                return "Home";
            }

            var lastSegment = (relativePageUrl ?? string.Empty)
                .Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries)
                .LastOrDefault();

            if (string.IsNullOrWhiteSpace(lastSegment))
            {
                return "Home";
            }

            if (lastSegment.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
            {
                lastSegment = lastSegment.Substring(0, lastSegment.Length - 5);
            }

            return MarkdownPathHelper.FormatSectionTitle(lastSegment);
        }

        private static bool ParseBoolParameter(string value, bool defaultValue)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return defaultValue;
            }

            var normalized = value.Trim();
            if (string.Equals(normalized, "true", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(normalized, "1", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(normalized, "yes", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (string.Equals(normalized, "false", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(normalized, "0", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(normalized, "no", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            return defaultValue;
        }

        private class LlmsPageEntry
        {
            public bool IsRootPage { get; set; }

            public string Section { get; set; }

            public string Title { get; set; }

            public string Description { get; set; }

            public string PageUrl { get; set; }

            public string MarkdownUrl { get; set; }

            public bool HasCompanionMarkdown { get; set; }

            public string MarkdownBody { get; set; }
        }
    }
}
