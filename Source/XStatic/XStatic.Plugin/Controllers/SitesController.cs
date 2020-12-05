using System.Collections.Generic;
using System.IO;
using System.Web.Http;
using System.Web.UI;
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
        public IEnumerable<ExtendedGeneratedSite> GetAll()
        {
            var sites = _sitesRepo.GetAll();

            foreach(var site in sites)
            {
                var node = Umbraco.Content(site.RootNode);

                site.RootPath = node.Parent == null ? node.Name : node.Parent.Name + "/" + node.Name;
            }

            return sites;
        }
    }

    public class ExtendedGeneratedSite : GeneratedSite
    {
        public string RootPath { get; set; }
    }
}
