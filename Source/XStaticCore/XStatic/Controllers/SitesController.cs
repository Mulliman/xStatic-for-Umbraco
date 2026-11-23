using Asp.Versioning;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using System;
using System.Collections.Generic;
using Microsoft.Extensions.Options;
using System.IO;
using System.Linq;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Common.Filters;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Web;
using Umbraco.Extensions;
using XStatic.Controllers.Attributes;
using XStatic.Core.Actions;
using XStatic.Core.App;
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
        IDeploymentTargetRepository deploymentTargetRepository,
        IOptions<XStaticGlobalSettings> globalSettings) : Controller
    {
        private readonly IUmbracoContextFactory _context = context;
        private readonly IStaticSiteStorer _storer = storer;
        private readonly IExportTypeRepository _exportTypeRepo = exportTypeRepo;
        private readonly IActionRepository _actionRepository = actionRepository;
        private readonly IDeploymentTargetRepository _deploymentTargetRepository = deploymentTargetRepository;
        private readonly ISitesRepository _sitesRepo = sitesRepository;

        [HttpGet("get-all")]
        [MapToApiVersion("1.0")]
        [EndpointName("Sites_GetAll")]
        [EndpointSummary("List all static sites")]
        [EndpointDescription("Returns all configured xStatic static sites enriched with root content path, export type name, and stored output folder size.")]
        [ProducesResponseType(typeof(IEnumerable<SiteApiModel>), StatusCodes.Status200OK)]
        public IEnumerable<SiteApiModel> GetAll()
        {
            var sites = _sitesRepo.GetAll();
            var exportTypes = _exportTypeRepo.GetAll().ToList();

            using var cref = _context.EnsureUmbracoContext();

            foreach (var site in sites)
            {
                EnrichSite(site, exportTypes, cref);
            }

            return sites.Select(s => new SiteApiModel(s));
        }

        [HttpGet("{staticSiteId:int}")]
        [MapToApiVersion("1.0")]
        [EndpointName("Sites_GetById")]
        [EndpointSummary("Get a static site by ID")]
        [EndpointDescription("Returns configuration and build/deploy status for a single xStatic static site.")]
        [ProducesResponseType(typeof(SiteApiModel), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<SiteApiModel> GetById(int staticSiteId)
        {
            var site = _sitesRepo.Get<ExtendedGeneratedSite>(staticSiteId);
            if (site == null)
            {
                return NotFound();
            }

            var exportTypes = _exportTypeRepo.GetAll().ToList();
            using var cref = _context.EnsureUmbracoContext();
            EnrichSite(site, exportTypes, cref);

            return Ok(new SiteApiModel(site));
        }

        [HttpPost("create")]
        [MapToApiVersion("1.0")]
        [EndpointName("Sites_Create")]
        [EndpointSummary("Create a static site")]
        [EndpointDescription("Creates a new xStatic static site configuration.")]
        [ProducesResponseType(typeof(SiteApiModel), StatusCodes.Status200OK)]
        public SiteApiModel Create([FromBody] SiteUpdateModel site)
        {
            var entity = _sitesRepo.Create(site);

            return new SiteApiModel(entity);
        }

        [HttpPost("update")]
        [MapToApiVersion("1.0")]
        [EndpointName("Sites_Update")]
        [EndpointSummary("Update a static site")]
        [EndpointDescription("Updates an existing xStatic static site configuration.")]
        [ProducesResponseType(typeof(SiteApiModel), StatusCodes.Status200OK)]
        public SiteApiModel Update([FromBody] SiteUpdateModel site)
        {
            var updated = _sitesRepo.Update(site);

            return new SiteApiModel(updated);
        }

        [HttpDelete("delete")]
        [MapToApiVersion("1.0")]
        [EndpointName("Sites_Delete")]
        [EndpointSummary("Delete a static site")]
        [EndpointDescription("Deletes an xStatic static site configuration by ID.")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public void Delete(int staticSiteId)
        {
            _sitesRepo.Delete(staticSiteId);
        }

        [HttpDelete("clear-stored-site")]
        [MapToApiVersion("1.0")]
        [EndpointName("Sites_ClearStoredSite")]
        [EndpointSummary("Clear generated files for a static site")]
        [EndpointDescription("Deletes locally stored generated output files for the specified static site while preserving protected paths, then returns the updated site list.")]
        [ProducesResponseType(typeof(IEnumerable<SiteApiModel>), StatusCodes.Status200OK)]
        public IEnumerable<SiteApiModel> ClearStoredSite(int staticSiteId)
        {
            var folder = _storer.GetStorageLocationOfSite(staticSiteId);

            var doNotDeletePaths = FileHelpers.GetDoNotDeletePaths(globalSettings?.Value?.DoNotDeletePaths);

            FileHelpers.DeleteFolderContents(folder, doNotDeletePaths);

            return GetAll();
        }

        [HttpGet("get-site-dependencies")]
        [MapToApiVersion("1.0")]
        [EndpointName("Sites_GetDependencies")]
        [EndpointSummary("List site configuration dependencies")]
        [EndpointDescription("Returns available export types, safe post-generation action summaries, and safe deployment target summaries for configuring a static site.")]
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

        private void EnrichSite(ExtendedGeneratedSite site, IList<XStatic.Core.Generator.Db.ExportTypeDataModel> exportTypes, UmbracoContextReference cref)
        {
            var node = cref.UmbracoContext.Content.GetById(site.RootNode);

            site.ExportTypeName = exportTypes.FirstOrDefault(et => et.Id == site.ExportFormat)?.Name;

            if (node == null)
            {
                site.RootPath = "Item Not Found";
            }
            else
            {
                var parent = node.Parent();
                site.RootPath = parent == null ? node.Name : parent.Name + "/" + node.Name;

                var folder = _storer.GetStorageLocationOfSite(site.Id);
                var size = FileHelpers.GetDirectorySize(new DirectoryInfo(folder));

                site.FolderSize = FileHelpers.BytesToString(size);
            }
        }
    }

    public class SiteDependenciesModel
    {
        public IEnumerable<SafeActionModel> Actions { get; set; }

        public IEnumerable<ExportTypeModel> ExportTypes { get; set; }

        public IEnumerable<SafeDeploymentTargetModel> Deployers { get; set; }
    }
}
