using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Services;
using XStatic.Core.App;
using XStatic.Core.Models;

namespace XStatic.Core.AutoPublish
{
    /// <summary>
    /// Resolves affected auto-publish sites for shared content items, Library nodes, and reusable Elements
    /// (Umbraco 17+ / 18 / 19) that live outside a site's root content tree.
    /// Walks upstream Umbraco relations (<see cref="IRelationService.GetByChildId"/>) to locate referencing
    /// pages within configured static sites, and also honors configured global shared content types.
    /// </summary>
    public class RelationBasedAutoPublishSiteResolver : IAutoPublishSiteResolver
    {
        private readonly IRelationService _relationService;
        private readonly IContentService _contentService;
        private readonly IOptions<XStaticGlobalSettings> _globalSettings;
        private readonly ILogger<RelationBasedAutoPublishSiteResolver> _logger;

        public RelationBasedAutoPublishSiteResolver(
            IRelationService relationService,
            IContentService contentService,
            IOptions<XStaticGlobalSettings> globalSettings = null,
            ILogger<RelationBasedAutoPublishSiteResolver> logger = null)
        {
            _relationService = relationService;
            _contentService = contentService;
            _globalSettings = globalSettings;
            _logger = logger;
        }

        public IEnumerable<ExtendedGeneratedSite> ResolveAffectedSites(
            IEnumerable<IContent> publishedEntities,
            IReadOnlyCollection<ExtendedGeneratedSite> autoPublishSites,
            IReadOnlyDictionary<int, IPublishedContent> siteRootNodes)
        {
            var settings = _globalSettings?.Value;
            if (settings != null && !settings.EnableRelationBasedAutoPublish)
            {
                return Enumerable.Empty<ExtendedGeneratedSite>();
            }

            var affected = new List<ExtendedGeneratedSite>();
            var addedSiteIds = new HashSet<int>();

            var globalAliases = new HashSet<string>(
                settings?.AutoPublishGlobalContentTypes ?? Enumerable.Empty<string>(),
                StringComparer.OrdinalIgnoreCase);

            var maxDepth = settings?.AutoPublishMaxRelationDepth > 0
                ? settings.AutoPublishMaxRelationDepth
                : XStaticGlobalSettings.DefaultAutoPublishMaxRelationDepth;

            foreach (var publishedItem in publishedEntities)
            {
                if (publishedItem == null)
                {
                    continue;
                }

                // If the published item's content type is explicitly marked as a global/shared type,
                // mark all auto-publish sites as affected.
                var alias = publishedItem.ContentType?.Alias;
                if (!string.IsNullOrEmpty(alias) && globalAliases.Contains(alias))
                {
                    foreach (var site in autoPublishSites)
                    {
                        if (addedSiteIds.Add(site.Id))
                        {
                            affected.Add(site);
                        }
                    }

                    if (addedSiteIds.Count == autoPublishSites.Count)
                    {
                        break;
                    }

                    continue;
                }

                // Walk upstream relations (e.g. Library/Element -> Block -> Page) to find referencing nodes inside any site tree.
                var referencingPaths = FindReferencingContentPaths(publishedItem.Id, maxDepth);

                foreach (var path in referencingPaths)
                {
                    foreach (var site in autoPublishSites)
                    {
                        if (addedSiteIds.Contains(site.Id))
                        {
                            continue;
                        }

                        if (siteRootNodes.TryGetValue(site.Id, out var siteRoot) &&
                            PathBasedAutoPublishSiteResolver.IsSiteRootNodeInPath(path, siteRoot?.Id))
                        {
                            addedSiteIds.Add(site.Id);
                            affected.Add(site);
                        }
                    }
                }
            }

            return affected;
        }

        private IEnumerable<string> FindReferencingContentPaths(int childId, int maxDepth)
        {
            var paths = new List<string>();
            if (_relationService == null || _contentService == null)
            {
                return paths;
            }

            var visited = new HashSet<int> { childId };
            var queue = new Queue<(int NodeId, int Depth)>();
            queue.Enqueue((childId, 0));

            while (queue.Count > 0)
            {
                var (currentId, depth) = queue.Dequeue();
                if (depth >= maxDepth)
                {
                    continue;
                }

                IEnumerable<IRelation> relations;
                try
                {
                    relations = _relationService.GetByChildId(currentId);
                }
                catch (Exception ex)
                {
                    _logger?.LogWarning(ex, "xStatic failed to query relations for content ID {ContentId}", currentId);
                    continue;
                }

                if (relations == null)
                {
                    continue;
                }

                foreach (var relation in relations)
                {
                    if (relation == null || !visited.Add(relation.ParentId))
                    {
                        continue;
                    }

                    var parentContent = _contentService.GetById(relation.ParentId);
                    if (parentContent != null && !string.IsNullOrEmpty(parentContent.Path))
                    {
                        paths.Add(parentContent.Path);
                    }

                    queue.Enqueue((relation.ParentId, depth + 1));
                }
            }

            return paths;
        }
    }
}
