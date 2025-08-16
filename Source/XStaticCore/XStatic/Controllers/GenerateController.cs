using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.BackOffice.Controllers;
using Umbraco.Cms.Web.Common.Attributes;
using XStatic.Core.Actions;
using XStatic.Core.Generator.ExportTypes;
using XStatic.Core.Generator.Processes;
using XStatic.Core.Repositories;

namespace XStatic.Controllers
{
	using Microsoft.Extensions.Logging;
	using Microsoft.Extensions.Options;
	using XStatic.Core.App;
	using XStatic.Core.Generator.Storage;

	[PluginController("xstatic")]
    public class GenerateController : UmbracoAuthorizedJsonController
    {
        private readonly IUmbracoContextFactory _umbracoContextFactory;
        private readonly IExportTypeService _exportTypeService;
        private ISitesRepository _sitesRepo;
        private IWebHostEnvironment _webHostEnvironment;
        private readonly IActionFactory _actionFactory;
        private readonly IOptions<XStaticGlobalSettings> _globalSettings;   
        private readonly ILogger<GenerateController> _logger;

        public GenerateController(
            IUmbracoContextFactory umbracoContextFactory,
            IExportTypeService exportTypeService,
            ISitesRepository sitesRepository,
            IWebHostEnvironment webHostEnvironment,
            IActionFactory actionFactory,
            IOptions<XStaticGlobalSettings> globalSettings,
            ILogger<GenerateController> logger)
        {
            _umbracoContextFactory = umbracoContextFactory;
            _exportTypeService = exportTypeService;
            _sitesRepo = sitesRepository;
            _webHostEnvironment = webHostEnvironment;
            _actionFactory = actionFactory;
            _globalSettings = globalSettings;
            _logger = logger;
        }

        [HttpGet]
        public async Task<RebuildProcessResult> RebuildStaticSite(int staticSiteId)
        {
            var process = new RebuildProcess(_umbracoContextFactory, _exportTypeService, _sitesRepo, _webHostEnvironment, _actionFactory, _globalSettings, _logger);

            return await process.RebuildSite(staticSiteId);
        }
    }
}