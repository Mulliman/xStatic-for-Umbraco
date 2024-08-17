using Asp.Versioning;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Common.Filters;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Web;
using XStatic.Controllers.Attributes;
using XStatic.Core.Actions;
using XStatic.Core.Deploy.Targets;
using XStatic.Core.Generator.ExportTypes;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Helpers;
using XStatic.Core.Models;
using XStatic.Core.Repositories;
using XStatic.Models;

namespace XStatic.Controllers
{
    [ApiController]
    [ApiVersion("1.0")]
    [MapToApi("xstatic-v1")]
    [AuthorizeNormalUser]
    [JsonOptionsName(Constants.JsonOptionsNames.BackOffice)]
    [Route("api/v{version:apiVersion}/xstatic/sites")]
    public class SitesController(IUmbracoContextFactory context,
        ISitesRepository sitesRepository,
        IStaticSiteStorer storer,
        IExportTypeRepository exportTypeRepo,
        IActionRepository actionRepository,
        IDeploymentTargetRepository deploymentTargetRepository) : Controller
    {
        private readonly IUmbracoContextFactory _context = context;
        private readonly IStaticSiteStorer _storer = storer;
        private readonly IExportTypeRepository _exportTypeRepo = exportTypeRepo;
        private readonly IActionRepository _actionRepository = actionRepository;
        private readonly IDeploymentTargetRepository _deploymentTargetRepository = deploymentTargetRepository;
        private readonly ISitesRepository _sitesRepo = sitesRepository;

        [HttpGet("get-all")]
        [MapToApiVersion("1.0")]
        [ProducesResponseType(typeof(IEnumerable<SiteApiModel>), StatusCodes.Status200OK)]
        public IEnumerable<SiteApiModel> GetAll()
        {
            var sites = _sitesRepo.GetAll();
            var exportTypes = _exportTypeRepo.GetAll();

            using var cref = _context.EnsureUmbracoContext();

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

            return sites.Select(s => new SiteApiModel(s));
        }

        [HttpPost("create")]
        [MapToApiVersion("1.0")]
        [ProducesResponseType(typeof(SiteApiModel), StatusCodes.Status200OK)]
        public SiteApiModel Create([FromBody] SiteUpdateModel site)
        {
            var entity = _sitesRepo.Create(site);

            return new SiteApiModel(entity);
        }

        [HttpPost("update")]
        [MapToApiVersion("1.0")]
        [ProducesResponseType(typeof(SiteApiModel), StatusCodes.Status200OK)]
        public SiteApiModel Update([FromBody] SiteUpdateModel site)
        {
            var updated = _sitesRepo.Update(site);

            return new SiteApiModel(updated);
        }

        [HttpDelete("delete")]
        [MapToApiVersion("1.0")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public void Delete(int staticSiteId)
        {
            _sitesRepo.Delete(staticSiteId);
        }

        [HttpDelete("clear-stored-site")]
        [MapToApiVersion("1.0")]
        [ProducesResponseType(typeof(IEnumerable<SiteApiModel>), StatusCodes.Status200OK)]
        public IEnumerable<SiteApiModel> ClearStoredSite(int staticSiteId)
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

        [HttpGet("get-site-dependencies")]
        [MapToApiVersion("1.0")]
        [ProducesResponseType(typeof(SiteDependenciesModel), StatusCodes.Status200OK)]
        public SiteDependenciesModel GetSiteDependencies()
        {
            var exportTypes = _exportTypeRepo.GetAll()?.Select(e => new ExportTypeModel(e));
            var actions = _actionRepository.GetAll()?.Select(a => new SafeActionModel(a));
            var deployers = _deploymentTargetRepository.GetAll()?.Select(d => new SafeDeploymentTargetModel(d));

            return new SiteDependenciesModel
            {
                Actions = actions,
                ExportTypes = exportTypes,
                Deployers = deployers
            };
        }
    }

    public class SiteDependenciesModel
    {
        public IEnumerable<SafeActionModel> Actions { get; set; }

        public IEnumerable<ExportTypeModel> ExportTypes { get; set; }

        public IEnumerable<SafeDeploymentTargetModel> Deployers { get; set; }
    }
}
