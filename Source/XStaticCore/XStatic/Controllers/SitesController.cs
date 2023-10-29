using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.BackOffice.Controllers;
using Umbraco.Cms.Web.Common.Attributes;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.ExportTypes;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Helpers;
using XStatic.Core.Models;
using XStatic.Core.Repositories;

namespace XStatic.Controllers
{
    [PluginController("xstatic")]
    public class SitesController : UmbracoAuthorizedJsonController
    {
        private readonly IUmbracoContextFactory _context;

        private readonly IStaticSiteStorer _storer;
        private readonly IHeadlessApiRequestRespository _exportTypeRepo;
        private ISitesRepository _sitesRepo;

        public SitesController(IUmbracoContextFactory context,
            ISitesRepository sitesRepository,
            IStaticSiteStorer storer,
            IHeadlessApiRequestRespository exportTypeRepo)
        {
            _context = context;
            _sitesRepo = sitesRepository;
            _storer = storer;
            _exportTypeRepo = exportTypeRepo;
        }

        [HttpGet]
        public IEnumerable<ExtendedGeneratedSite> GetAll()
        {
            var sites = _sitesRepo.GetAll();
            var exportTypes = _exportTypeRepo.GetAll();

            using (var cref = _context.EnsureUmbracoContext())
            {
                foreach (var site in sites)
                {
                    var node = cref.UmbracoContext.Content.GetById(site.RootNode);

                    site.ExportTypeName = exportTypes.FirstOrDefault(et => et.Id == site.ExportFormat)?.Name;

                    if (node == null)
                    {
                        site.RootPath = "Item Not Found";
                    }
                    else
                    {
                        site.RootPath = node.Parent == null ? node.Name : node.Parent.Name + "/" + node.Name;

                        var folder = _storer.GetStorageLocationOfSite(site.Id);
                        var size = FileHelpers.GetDirectorySize(new DirectoryInfo(folder));

                        site.FolderSize = FileHelpers.BytesToString(size);
                    }
                }

                return sites;
            }
        }

        [HttpPost]
        public SiteConfig Create([FromBody] SiteUpdateModel site)
        {
            var entity = _sitesRepo.Create(site);

            return entity;
        }

        [HttpPost]
        public ExtendedGeneratedSite Update([FromBody] SiteUpdateModel site)
        {
            return _sitesRepo.Update(site);
        }

        [HttpDelete]
        public void Delete(int staticSiteId)
        {
            _sitesRepo.Delete(staticSiteId);
        }

        [HttpDelete]
        public IEnumerable<ExtendedGeneratedSite> ClearStoredSite(int staticSiteId)
        {
            var folder = _storer.GetStorageLocationOfSite(staticSiteId);

            var doNotDeletePaths = FileHelpers.DefaultNonDeletePaths;

            var doNotDeletePathsRaw = ConfigurationManager.AppSettings["xStatic.DoNotDeletePaths"];

            if (doNotDeletePathsRaw != null)
            {
                var split = doNotDeletePathsRaw.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);

                if (split.Any())
                {
                    doNotDeletePaths = split;
                }
            }

            FileHelpers.DeleteFolderContents(folder, doNotDeletePaths);

            return GetAll();
        }
    }
}
