using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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
    [XStaticEditableField(RagExportFields.OutputFormat, UIEditors.Text)]
    [XStaticEditableField(RagExportFields.OutputPath, UIEditors.Text)]
    [XStaticEditableField(RagExportFields.MaxChunkSize, UIEditors.Integer)]
    [XStaticEditableField(RagExportFields.ChunkOverlap, UIEditors.Integer)]
    [XStaticEditableField(RagExportFields.SplitOnHeadings, UIEditors.Toggle)]
    [XStaticEditableField(RagExportFields.ExcludedPaths, UIEditors.Text)]
    [XStaticEditableField(RagExportFields.ExcludedDocTypes, UIEditors.Text)]
    [XStaticEditableField(RagExportFields.CustomPropertyAliases, UIEditors.Text)]
    [XStaticEditableField(RagExportFields.GenerateWebMcpIndex, UIEditors.Toggle)]
    [XStaticEditableField(RagExportFields.WebMcpIndexPath, UIEditors.Text)]
    public class RagExportPostGenerationAction : PostGenerationActionBase
    {
        private readonly ISitesRepository _sitesRepository;
        private readonly IRagExportService _ragExportService;
        private readonly IUmbracoContextFactory _umbracoContextFactory;
        private readonly IPublishedUrlProvider _publishedUrlProvider;

        public override string Name => nameof(RagExportPostGenerationAction);

        public RagExportPostGenerationAction(
            ISitesRepository sitesRepository,
            IRagExportService ragExportService,
            IUmbracoContextFactory umbracoContextFactory = null,
            IPublishedUrlProvider publishedUrlProvider = null)
        {
            _sitesRepository = sitesRepository;
            _ragExportService = ragExportService;
            _umbracoContextFactory = umbracoContextFactory;
            _publishedUrlProvider = publishedUrlProvider;
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
            catch
            {
                // Fall back to HTML-only extraction if Umbraco context is unavailable
            }

            return metadataMap;
        }

        private void AddNodeMetadata(
            IDictionary<string, RagPageMetadata> map,
            IPublishedContent node,
            string culture,
            IList<string> customPropertyAliases)
        {
            var relativeUrl = node.Url(_publishedUrlProvider, culture, UrlMode.Relative);
            if (string.IsNullOrWhiteSpace(relativeUrl) || relativeUrl == "#")
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
                    if (value != null)
                    {
                        customProps[alias] = value is string or int or long or double or decimal or bool or DateTime or DateTimeOffset
                            ? value
                            : value.ToString();
                    }
                }
            }

            map[relativeUrl] = new RagPageMetadata
            {
                DocType = node.ContentType?.Alias,
                LastModified = new DateTimeOffset(DateTime.SpecifyKind(node.UpdateDate, DateTimeKind.Utc)),
                Culture = culture,
                CustomProperties = customProps
            };
        }
    }
}
