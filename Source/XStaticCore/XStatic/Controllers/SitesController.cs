using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Common.Filters;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.OpenApi;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.Authorization;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.ExportTypes;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Helpers;
using XStatic.Core.Models;
using XStatic.Core.Repositories;
using XStatic.Models;

namespace XStatic.Controllers
{
    public class XStaticBackOfficeSecurityRequirementsOperationFilter : BackOfficeSecurityRequirementsOperationFilterBase
    {
        protected override string ApiName => "xstatic-sites-v1";
    }

    public class XStaticConfigureSwaggerGenOptions : IConfigureOptions<SwaggerGenOptions>
    {
        public void Configure(SwaggerGenOptions options)
        {
            options.SwaggerDoc("xstatic-sites-v1", new OpenApiInfo { Title = "xStatic Sites v1", Version = "1.0" });
            options.OperationFilter<XStaticBackOfficeSecurityRequirementsOperationFilter>();
        }
    }

    public class MyComposer : IComposer
    {
        public void Compose(IUmbracoBuilder builder)
            => builder.Services.ConfigureOptions<XStaticConfigureSwaggerGenOptions>();
    }

    [ApiController]
    [ApiVersion("1.0")]
    [MapToApi("xstatic-sites-v1")]
    [Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]
    [JsonOptionsName(Constants.JsonOptionsNames.BackOffice)]
    [Route("api/v{version:apiVersion}/xstatic")]
    public class SitesController(IBackOfficeSecurityAccessor backOfficeSecurityAccessor,
        IUmbracoContextFactory context,
        ISitesRepository sitesRepository,
        IStaticSiteStorer storer,
        IExportTypeRepository exportTypeRepo) : Controller
    {
        private readonly IBackOfficeSecurityAccessor _backOfficeSecurityAccessor = backOfficeSecurityAccessor;
        private readonly IUmbracoContextFactory _context = context;
        private readonly IStaticSiteStorer _storer = storer;
        private readonly IExportTypeRepository _exportTypeRepo = exportTypeRepo;
        private readonly ISitesRepository _sitesRepo = sitesRepository;

        [HttpGet("get-all")]
        [MapToApiVersion("1.0")]
        [ProducesResponseType(typeof(IEnumerable<SiteApiModel>), StatusCodes.Status200OK)]
        public IEnumerable<SiteApiModel> GetAll()
        {
        //    if (_backOfficeSecurityAccessor.BackOfficeSecurity?.CurrentUser == null)
        //    {
        //        throw new InvalidOperationException("No backoffice user found");
        //    }

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
        [ProducesResponseType(typeof(SiteConfig), StatusCodes.Status200OK)]
        public SiteConfig Create([FromBody] SiteUpdateModel site)
        {
            var entity = _sitesRepo.Create(site);

            return entity;
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
    }
}
