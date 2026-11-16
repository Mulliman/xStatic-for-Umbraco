using Asp.Versioning;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Threading.Tasks;

using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Common.Filters;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Web;

using XStatic.Core.App;
using XStatic.Controllers.Attributes;
using XStatic.Core.Actions;
using XStatic.Core.Generator.ExportTypes;
using XStatic.Core.Generator.Processes;
using XStatic.Core.Repositories;

namespace XStatic.Controllers
{
	[ApiController]
	[ApiVersion("1.0")]
	[MapToApi("xstatic-v1")]
	[AuthorizeNormalUser]
	[JsonOptionsName(Constants.JsonOptionsNames.BackOffice)]
	[Route("api/v{version:apiVersion}/xstatic/generate")]
	public class GenerateController(
		IUmbracoContextFactory umbracoContextFactory,
		IExportTypeService exportTypeService,
		ISitesRepository sitesRepository,
		IWebHostEnvironment webHostEnvironment,
		IActionFactory actionFactory,
		IOptions<XStaticGlobalSettings> globalSettings,
		ILogger<GenerateController> logger
		) : ManagementApiControllerBase
	{
		private readonly IUmbracoContextFactory _umbracoContextFactory = umbracoContextFactory;
		private readonly IExportTypeService _exportTypeService = exportTypeService;
		private readonly ISitesRepository _sitesRepo = sitesRepository;
		private readonly IWebHostEnvironment _webHostEnvironment = webHostEnvironment;
		private readonly IActionFactory _actionFactory = actionFactory;
		private readonly IOptions<XStaticGlobalSettings> _globalSettings = globalSettings;
		private readonly ILogger<GenerateController> _logger = logger;

		[HttpPost("generate-site")]
		[MapToApiVersion("1.0")]
		[ProducesResponseType(typeof(RebuildProcessResult), StatusCodes.Status200OK)]
		public async Task<RebuildProcessResult> RebuildStaticSite(int staticSiteId)
		{
			var process = new RebuildProcess(_umbracoContextFactory, _exportTypeService, _sitesRepo, _webHostEnvironment, _actionFactory, _globalSettings, _logger);

			return await process.RebuildSite(staticSiteId);
		}
	}
}