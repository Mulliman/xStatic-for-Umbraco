using System.Collections.Generic;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using XStatic.Core.Models;

namespace XStatic.Core.AutoPublish
{
    /// <summary>
    /// Extension hook used by <see cref="DefaultAutoPublisher"/> to determine which auto-publish sites
    /// are affected when one or more Umbraco content items are published.
    /// Register additional implementations to support custom dependency graphs such as
    /// Umbraco 18/19 Library &amp; reusable Elements or external data sources.
    /// </summary>
    public interface IAutoPublishSiteResolver
    {
        IEnumerable<ExtendedGeneratedSite> ResolveAffectedSites(
            IEnumerable<IContent> publishedEntities,
            IReadOnlyCollection<ExtendedGeneratedSite> autoPublishSites,
            IReadOnlyDictionary<int, IPublishedContent> siteRootNodes);
    }
}
