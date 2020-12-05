using System.Collections.Generic;
using System.Web.Http;
using Umbraco.Web.Editors;
using Umbraco.Web.Mvc;
using XStatic.Plugin.Repositories;

namespace XStatic.Plugin.Controllers
{
    [PluginController("xstatic")]
    public class SitesController : UmbracoAuthorizedJsonController
    {
        private SitesRepository _sitesRepo;

        public SitesController()
        {
            _sitesRepo = new SitesRepository();
        }

        [HttpGet]
        public IEnumerable<GeneratedSite> GetAll()
        {
            var sites = _sitesRepo.GetAll();

            return sites;
        }
    }
}
