using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using XStatic.Core.Actions.FileActions;
using XStatic.Core.Generator.Markdown;
using XStatic.Core.Generator.Storage;

namespace XStatic.Core.Actions
{
    public class GenerateCompanionMarkdownFields
    {
        public const string ContentSelector = "ContentSelector";
        public const string ExcludePaths = "ExcludePaths";
    }

    /// <summary>
    /// Post-generation action that creates clean companion Markdown (.md) files alongside generated .html pages.
    /// </summary>
    [XStaticEditableField(GenerateCompanionMarkdownFields.ContentSelector, UIEditors.Text)]
    [XStaticEditableField(GenerateCompanionMarkdownFields.ExcludePaths, UIEditors.Text)]
    public class GenerateCompanionMarkdownAction : PostGenerationActionBase
    {
        private readonly IStaticSiteStorer _staticSiteStorer;
        private readonly IHtmlToMarkdownConverter _markdownConverter;

        public override string Name => nameof(GenerateCompanionMarkdownAction);

        public GenerateCompanionMarkdownAction(
            IStaticSiteStorer staticSiteStorer,
            IHtmlToMarkdownConverter markdownConverter = null)
        {
            _staticSiteStorer = staticSiteStorer;
            _markdownConverter = markdownConverter ?? new HtmlToMarkdownConverter();
        }

        public override async Task<XStaticResult> RunAction(int staticSiteId, Dictionary<string, string> parameters)
        {
            parameters ??= new Dictionary<string, string>();

            var siteRoot = _staticSiteStorer.GetStorageLocationOfSite(staticSiteId);
            if (string.IsNullOrWhiteSpace(siteRoot) || !Directory.Exists(siteRoot))
            {
                return XStaticResult.Error($"Generated site directory not found for site {staticSiteId}.");
            }

            var contentSelector = GetParameter(parameters, GenerateCompanionMarkdownFields.ContentSelector);
            var excludePathsRaw = GetParameter(parameters, GenerateCompanionMarkdownFields.ExcludePaths);
            var excludedPrefixes = ParseExcludePaths(excludePathsRaw);

            var options = new HtmlToMarkdownOptions
            {
                ContentSelector = contentSelector
            };

            try
            {
                var htmlFiles = EnumerateHtmlFiles(siteRoot)
                    .OrderBy(f => f, StringComparer.OrdinalIgnoreCase);

                foreach (var htmlFile in htmlFiles)
                {
                    var relativeHtmlPath = Path.GetRelativePath(siteRoot, htmlFile).Replace('\\', '/');
                    var pageUrl = MarkdownPathHelper.GetPageUrlFromHtmlFilePath(relativeHtmlPath);

                    if (IsExcluded(pageUrl, relativeHtmlPath, excludedPrefixes))
                    {
                        continue;
                    }

                    var html = await File.ReadAllTextAsync(htmlFile, Encoding.UTF8);
                    var markdown = _markdownConverter.Convert(html, options);
                    var markdownRelativePath = MarkdownPathHelper.GetCompanionMarkdownPath(relativeHtmlPath);

                    await _staticSiteStorer.StoreSiteItem(staticSiteId.ToString(), markdownRelativePath, markdown, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
                }

                return XStaticResult.Success();
            }
            catch (Exception ex)
            {
                return XStaticResult.Error("Failed to generate companion Markdown files.", ex);
            }
        }

        internal static IEnumerable<string> EnumerateHtmlFiles(string siteRoot)
        {
            return Directory.EnumerateFiles(siteRoot, "*.*", SearchOption.AllDirectories)
                .Where(f => f.EndsWith(".html", StringComparison.OrdinalIgnoreCase) ||
                            f.EndsWith(".htm", StringComparison.OrdinalIgnoreCase));
        }

        internal static List<string> ParseExcludePaths(string excludePathsRaw)
        {
            if (string.IsNullOrWhiteSpace(excludePathsRaw))
            {
                return new List<string>();
            }

            return excludePathsRaw
                .Split(new[] { ',', ';', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(p => "/" + p.Trim().TrimStart('/'))
                .Where(p => p.Length > 1)
                .ToList();
        }

        internal static bool IsExcluded(string pageUrl, string relativeHtmlPath, List<string> excludedPrefixes)
        {
            if (excludedPrefixes == null || excludedPrefixes.Count == 0)
            {
                return false;
            }

            var normalizedPageUrl = pageUrl.StartsWith("/") ? pageUrl : "/" + pageUrl;
            var normalizedFilePath = "/" + relativeHtmlPath.TrimStart('/');

            foreach (var prefix in excludedPrefixes)
            {
                var trimmedPrefix = prefix.TrimEnd('/');
                if (normalizedPageUrl.Equals(prefix, StringComparison.OrdinalIgnoreCase) ||
                    normalizedPageUrl.Equals(trimmedPrefix + "/", StringComparison.OrdinalIgnoreCase) ||
                    normalizedPageUrl.StartsWith(trimmedPrefix + "/", StringComparison.OrdinalIgnoreCase) ||
                    normalizedFilePath.StartsWith(trimmedPrefix + "/", StringComparison.OrdinalIgnoreCase) ||
                    normalizedFilePath.Equals(prefix, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }

            return false;
        }
    }
}
