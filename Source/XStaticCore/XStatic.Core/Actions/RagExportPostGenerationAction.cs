using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Web;
using Umbraco.Extensions;
using XStatic.Core.Actions.FileActions;
using XStatic.Core.Generator.Db;
using XStatic.Core.Rag;
using XStatic.Core.Repositories;

namespace XStatic.Core.Actions
{
    [XStaticEditableField(RagExportFields.OutputFormat, UIEditors.Text, DefaultValue = "Jsonl")]
    [XStaticEditableField(RagExportFields.OutputPath, UIEditors.Text)]
    [XStaticEditableField(RagExportFields.MaxChunkSize, UIEditors.Integer, DefaultValue = "1000")]
    [XStaticEditableField(RagExportFields.ChunkOverlap, UIEditors.Integer, DefaultValue = "150")]
    [XStaticEditableField(RagExportFields.SplitOnHeadings, UIEditors.Toggle, DefaultValue = "true")]
    [XStaticEditableField(RagExportFields.ExcludedPaths, UIEditors.TextArea)]
    [XStaticEditableField(RagExportFields.ExcludedDocTypes, UIEditors.TextArea)]
    [XStaticEditableField(RagExportFields.CustomPropertyAliases, UIEditors.TextArea)]
    [XStaticEditableField(RagExportFields.GenerateWebMcpIndex, UIEditors.Toggle, DefaultValue = "true")]
    [XStaticEditableField(RagExportFields.WebMcpIndexPath, UIEditors.Text, DefaultValue = "webmcp-index.json")]
    public class RagExportPostGenerationAction : PostGenerationActionBase
    {
        private readonly ISitesRepository _sitesRepository;
        private readonly IRagExportService _ragExportService;
        private readonly IUmbracoContextFactory _umbracoContextFactory;
        private readonly IPublishedUrlProvider _publishedUrlProvider;
        private readonly ILogger<RagExportPostGenerationAction> _logger;

        public override string Name => nameof(RagExportPostGenerationAction);

        public RagExportPostGenerationAction(
            ISitesRepository sitesRepository,
            IRagExportService ragExportService,
            IUmbracoContextFactory umbracoContextFactory = null,
            IPublishedUrlProvider publishedUrlProvider = null,
            ILogger<RagExportPostGenerationAction> logger = null)
        {
            _sitesRepository = sitesRepository;
            _ragExportService = ragExportService;
            _umbracoContextFactory = umbracoContextFactory;
            _publishedUrlProvider = publishedUrlProvider;
            _logger = logger;
        }

        public override async Task<XStaticResult> RunAction(int staticSiteId, Dictionary<string, string> parameters)
        {
            var siteConfig = _sitesRepository?.Get<SiteConfig>(staticSiteId);
            if (siteConfig == null)
            {
                return XStaticResult.Error("Site config not found.");
            }

            var options = RagExportOptions.FromParameters(
                parameters,
                defaultBaseUrl: siteConfig.TargetHostname,
                siteName: siteConfig.Name);

            var pageMetadata = CollectUmbracoMetadata(siteConfig, options);

            try
            {
                var result = await _ragExportService.ExportAsync(
                    staticSiteId,
                    options,
                    pageMetadata,
                    parameters).ConfigureAwait(false);

                var failedPushers = result.VectorStoreResults?.Where(r => !r.WasSuccessful).ToList();
                if (failedPushers != null && failedPushers.Count > 0)
                {
                    var errors = string.Join("; ", failedPushers.Select(f => $"{f.PusherName}: {f.Message}"));
                    return XStaticResult.Error($"RAG export completed ({result.Chunks.Count} chunks) but vector store push failed: {errors}");
                }

                return XStaticResult.Success(
                    $"Exported {result.Chunks.Count} RAG chunk(s) across {result.Pages.Count} page(s).");
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Failed to export RAG chunks for static site {StaticSiteId}", staticSiteId);
                return XStaticResult.Error("Failed to export RAG chunks.", ex);
            }
        }

        private IReadOnlyDictionary<string, RagPageMetadata> CollectUmbracoMetadata(SiteConfig siteConfig, RagExportOptions options)
        {
            var metadataMap = new Dictionary<string, RagPageMetadata>(StringComparer.OrdinalIgnoreCase);

            if (_umbracoContextFactory == null || _publishedUrlProvider == null || siteConfig.RootNode == Guid.Empty)
            {
                return metadataMap;
            }

            try
            {
                using var contextRef = _umbracoContextFactory.EnsureUmbracoContext();
                var rootNode = contextRef.UmbracoContext?.Content?.GetById(siteConfig.RootNode);
                if (rootNode == null)
                {
                    return metadataMap;
                }

                var cultures = siteConfig.Cultures?.Where(c => !string.IsNullOrWhiteSpace(c)).ToList();
                var allNodes = new List<IPublishedContent> { rootNode };
                allNodes.AddRange(rootNode.Descendants());

                foreach (var node in allNodes)
                {
                    if (cultures != null && cultures.Count > 0)
                    {
                        foreach (var culture in cultures)
                        {
                            AddNodeMetadata(metadataMap, node, culture, options.CustomPropertyAliases);
                        }
                    }
                    else
                    {
                        AddNodeMetadata(metadataMap, node, null, options.CustomPropertyAliases);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger?.LogWarning(ex, "Unable to collect Umbraco metadata for static site {StaticSiteId}; falling back to HTML-only extraction.", siteConfig.Id);
            }

            return metadataMap;
        }

        private void AddNodeMetadata(
            IDictionary<string, RagPageMetadata> map,
            IPublishedContent node,
            string culture,
            IList<string> customPropertyAliases)
        {
            var rawUrl = node.Url(_publishedUrlProvider, culture, UrlMode.Relative);
            if (string.IsNullOrWhiteSpace(rawUrl) || rawUrl == "#")
            {
                return;
            }

            // Domain-bound cultures may return an absolute URL even with UrlMode.Relative
            var relativeUrl = Uri.TryCreate(rawUrl, UriKind.Absolute, out var absoluteUri)
                ? absoluteUri.AbsolutePath
                : rawUrl;

            if (map.ContainsKey(relativeUrl))
            {
                return;
            }

            var customProps = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
            if (customPropertyAliases != null)
            {
                foreach (var alias in customPropertyAliases)
                {
                    if (string.IsNullOrWhiteSpace(alias) || !node.HasProperty(alias))
                    {
                        continue;
                    }

                    var prop = node.GetProperty(alias);
                    var value = prop?.GetValue(culture) ?? prop?.GetSourceValue(culture);
                    var serializable = ToSerializableValue(value);
                    if (serializable != null)
                    {
                        customProps[alias] = serializable;
                    }
                }
            }

            var updateDate = !string.IsNullOrWhiteSpace(culture)
                ? node.CultureDate(culture)
                : node.UpdateDate;
            if (updateDate == default)
            {
                updateDate = node.UpdateDate;
            }

            map[relativeUrl] = new RagPageMetadata
            {
                DocType = node.ContentType?.Alias,
                LastModified = new DateTimeOffset(DateTime.SpecifyKind(updateDate, DateTimeKind.Utc)),
                Culture = culture,
                CustomProperties = customProps
            };
        }

        private static object ToSerializableValue(object value)
        {
            if (value == null)
            {
                return null;
            }

            if (value is string s)
            {
                return string.IsNullOrWhiteSpace(s) ? null : s;
            }

            if (value is int or long or double or float or decimal or bool or DateTime or DateTimeOffset or Guid)
            {
                return value;
            }

            if (value is IEnumerable<string> strings)
            {
                var list = strings.Where(x => !string.IsNullOrWhiteSpace(x)).ToList();
                return list.Count > 0 ? list : null;
            }

            return null;
        }
    }
}
