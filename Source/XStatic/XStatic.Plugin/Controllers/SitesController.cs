using System;
using System.Collections.Generic;
using System.IO;
using System.Web.Http;
using System.Web.UI;
using Umbraco.Core.Composing;
using Umbraco.Web.Editors;
using Umbraco.Web.Mvc;
using XStatic.Generator.Storage;
using XStatic.Library;
using XStatic.Plugin.Repositories;

namespace XStatic.Plugin.Controllers
{
    [PluginController("xstatic")]
    public class SitesController : UmbracoAuthorizedJsonController
    {
        private readonly IStaticSiteStorer _storer;
        private SitesRepository _sitesRepo;

        public SitesController(IStaticSiteStorer storer)
        {
            _sitesRepo = new SitesRepository();
            _storer = storer;
        }

        [HttpGet]
        public IEnumerable<ExtendedGeneratedSite> GetAll()
        {
            var sites = _sitesRepo.GetAll();

            foreach(var site in sites)
            {
                var node = Umbraco.Content(site.RootNode);

                site.RootPath = node.Parent == null ? node.Name : node.Parent.Name + "/" + node.Name;

                var folder = _storer.GetStorageLocationOfSite(site.Id);
                var size = FileHelpers.GetDirectorySize(new DirectoryInfo(folder));

                site.FolderSize = FileHelpers.BytesToString(size);
            }

            return sites;
        }

        [HttpDelete]
        public IEnumerable<ExtendedGeneratedSite> ClearStoredSite(int staticSiteId)
        {
            var folder = _storer.GetStorageLocationOfSite(staticSiteId);

            FileHelpers.DeleteFolderContents(folder, FileHelpers.DefaultNonDeletePaths);
            
            return GetAll();
        }
    }

    public class ExtendedGeneratedSite : GeneratedSite
    {
        public string RootPath { get; set; }

        public string FolderSize { get; set; }
    }
}
