using System.Collections.Generic;
using XStatic.Models;
using XStatic.Plugin;

namespace XStatic.Repositories
{
    public interface ISitesRepository
    {
        SiteConfig Create(SiteUpdateModel update);
        ExtendedGeneratedSite Get(int staticSiteId);
        IEnumerable<ExtendedGeneratedSite> GetAll();
        IEnumerable<ExtendedGeneratedSite> GetAutoPublishSites();
        ExtendedGeneratedSite Update(SiteUpdateModel update);
        SiteConfig UpdateLastDeploy(int staticSiteId, int? secondsTaken = null);
        SiteConfig UpdateLastRun(int staticSiteId, int? secondsTaken = null);
    }
}