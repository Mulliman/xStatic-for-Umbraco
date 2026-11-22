using System.Collections.Generic;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using XStatic.Core.Models;

namespace XStatic.Core.AutoPublish
{
    /// <summary>
    /// Resolves affected auto-publish sites by checking whether any published item's Umbraco path
    /// contains or ends with a site's root node ID.
    /// </summary>
    public class PathBasedAutoPublishSiteResolver : IAutoPublishSiteResolver
    {
        public IEnumerable<ExtendedGeneratedSite> ResolveAffectedSites(
            IEnumerable<IContent> publishedEntities,
            IReadOnlyCollection<ExtendedGeneratedSite> autoPublishSites,
            IReadOnlyDictionary<int, IPublishedContent> siteRootNodes)
        {
            var affected = new List<ExtendedGeneratedSite>();
            var addedSiteIds = new HashSet<int>();

            foreach (var publishedItem in publishedEntities)
            {
                if (publishedItem == null || string.IsNullOrEmpty(publishedItem.Path))
                {
                    continue;
                }

                foreach (var site in autoPublishSites)
                {
                    if (addedSiteIds.Contains(site.Id))
                    {
                        continue;
                    }

                    if (siteRootNodes.TryGetValue(site.Id, out var siteRoot) &&
                        IsSiteRootNodeInPath(publishedItem.Path, siteRoot?.Id))
                    {
                        addedSiteIds.Add(site.Id);
                        affected.Add(site);
                    }
                }
            }

            return affected;
        }

        public static bool IsSiteRootNodeInPath(string path, int? rootNodeId)
        {
            if (string.IsNullOrEmpty(path) || !rootNodeId.HasValue)
            {
                return false;
            }

            return path.Contains($",{rootNodeId},") || path.EndsWith($",{rootNodeId}");
        }
    }
}
