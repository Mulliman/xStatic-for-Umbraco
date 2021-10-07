using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.BackOffice.Controllers;
//using System.Web.Http;
//using System.Web.UI;
using Umbraco.Cms.Web.Common.Attributes;
using XStatic.Models;
using XStatic.Plugin;
using XStatic.Repositories;
//using Umbraco.Core.Composing;
//using Umbraco.Web.Editors;
//using Umbraco.Web.Mvc;
//using XStatic.Generator.Storage;
//using XStatic.Library;
//using XStatic.Plugin.Repositories;

namespace XStatic.Plugin.Controllers
{
    [PluginController("xstatic")]
    public class SitesController : UmbracoAuthorizedJsonController
    {
        private readonly IUmbracoContextFactory _context;

        //private readonly IStaticSiteStorer _storer;
        private ISitesRepository _sitesRepo;

        //public SitesController() //IStaticSiteStorer storer)
        //{
            
        //    //_storer = storer;
        //}

        public SitesController(IUmbracoContextFactory context, ISitesRepository sitesRepository)
        {
            _context = context;
            _sitesRepo = sitesRepository;
        }

        [HttpGet]
        public IEnumerable<ExtendedGeneratedSite> GetAll()
        {
            //var sites = new[]
            //{
            //    new ExtendedGeneratedSite
            //    {
            //        AssetPaths = "/css",
            //        AutoPublish = false,
            //        ExportFormat = "json",
            //        FolderSize = "100Tb",
            //        Id = 1,
            //        ImageCrops = "200x200",
            //        LastBuildDurationInSeconds = 10,
            //        LastDeployDurationInSeconds = 10,
            //        LastDeployed = DateTime.Now,
            //        LastRun = DateTime.Now,
            //        MediaRootNodes = "1064,1065",
            //        Name = "Mock Data",
            //        RootNode = 1063,
            //        TargetHostname = "demo.com",
            //        DeploymentTarget = new DeploymentTargetModel
            //        {
            //            Id = "netlify",
            //            Name = "Netlify",
            //            Fields = new Dictionary<string, string>
            //                {
            //                    { "PersonalAccessToken", "Demo" },
            //                    { "SiteId", "THISISANID" }
            //                }
            //        }
            //    }
            //};

            var sites = _sitesRepo.GetAll();

            using (var cref = _context.EnsureUmbracoContext())
            {
                foreach (var site in sites)
                {
                    var node = cref.UmbracoContext.Content.GetById(site.RootNode);

                    if (node == null)
                    {
                        site.RootPath = "Item Not Found";
                    }
                    else
                    {
                        site.RootPath = node.Parent == null ? node.Name : node.Parent.Name + "/" + node.Name;

                        //var folder = _storer.GetStorageLocationOfSite(site.Id);
                        //var size = FileHelpers.GetDirectorySize(new DirectoryInfo(folder));

                        //site.FolderSize = FileHelpers.BytesToString(size);
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

            //[HttpDelete]
            //public IEnumerable<ExtendedGeneratedSite> ClearStoredSite(int staticSiteId)
            //{
            //    var folder = _storer.GetStorageLocationOfSite(staticSiteId);

            //    var doNotDeletePaths = FileHelpers.DefaultNonDeletePaths;

            //    var doNotDeletePathsRaw = ConfigurationManager.AppSettings["xStatic.DoNotDeletePaths"];

            //    if(doNotDeletePathsRaw != null)
            //    {
            //        var split = doNotDeletePathsRaw.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);

            //        if(split.Any())
            //        {
            //            doNotDeletePaths = split;
            //        }
            //    }

            //    FileHelpers.DeleteFolderContents(folder, doNotDeletePaths);

            //    return GetAll();
            //}
        }
}
