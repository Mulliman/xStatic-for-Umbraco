using System.Collections.Generic;
using XStatic.Core.Generator.Db;
using XStatic.Core.Models;
using XStatic.Plugin;

namespace XStatic.Core.Repositories
{
    public interface ISitesRepository
    {
        SiteConfig Create(SiteUpdateModel update);

        T Get<T>(int staticSiteId) where T : SiteConfig;

        IEnumerable<ExtendedGeneratedSite> GetAll();

        IEnumerable<ExtendedGeneratedSite> GetAutoPublishSites();

        ExtendedGeneratedSite Update(SiteUpdateModel update);

        void Delete(int id);

        SiteConfig UpdateLastDeploy(int staticSiteId, int? secondsTaken = null);

        SiteConfig UpdateLastRun(int staticSiteId, int? secondsTaken = null);
    }
}