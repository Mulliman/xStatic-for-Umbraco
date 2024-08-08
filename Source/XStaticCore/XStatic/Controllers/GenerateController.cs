using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Common.Filters;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.Authorization;
using XStatic.Core.Actions;
using XStatic.Core.Generator.ExportTypes;
using XStatic.Core.Generator.Processes;
using XStatic.Core.Repositories;

namespace XStatic.Controllers
{
    [ApiController]
    [ApiVersion("1.0")]
    [MapToApi("xstatic-v1")]
    [Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]
    [JsonOptionsName(Constants.JsonOptionsNames.BackOffice)]
    [Route("api/v{version:apiVersion}/xstatic/generate")]
    public class GenerateController(
        IUmbracoContextFactory umbracoContextFactory,
        IExportTypeService exportTypeService,
        ISitesRepository sitesRepository,
        IWebHostEnvironment webHostEnvironment,
        IActionFactory actionFactory) : ManagementApiControllerBase
    {
        private readonly IUmbracoContextFactory _umbracoContextFactory = umbracoContextFactory;
        private readonly IExportTypeService _exportTypeService = exportTypeService;
        private readonly ISitesRepository _sitesRepo = sitesRepository;
        private readonly IWebHostEnvironment _webHostEnvironment = webHostEnvironment;
        private readonly IActionFactory _actionFactory = actionFactory;

        [HttpPost("generate-site")]
        [MapToApiVersion("1.0")]
        [ProducesResponseType(typeof(RebuildProcessResult), StatusCodes.Status200OK)]
        public async Task<RebuildProcessResult> RebuildStaticSite(int staticSiteId)
        {
            var process = new RebuildProcess(_umbracoContextFactory, _exportTypeService, _sitesRepo, _webHostEnvironment, _actionFactory);

            return await process.RebuildSite(staticSiteId);
        }
    }
}