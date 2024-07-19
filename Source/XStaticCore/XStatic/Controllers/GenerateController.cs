using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core.Web;
using XStatic.Core.Actions;
using XStatic.Core.Generator.ExportTypes;
using XStatic.Core.Generator.Processes;
using XStatic.Core.Repositories;

namespace XStatic.Controllers
{
    [VersionedApiBackOfficeRoute("xstatic/generate")]
    [ApiExplorerSettings(GroupName = "xStatic")]
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

        [HttpGet]
        public async Task<RebuildProcessResult> RebuildStaticSite(int staticSiteId)
        {
            var process = new RebuildProcess(_umbracoContextFactory, _exportTypeService, _sitesRepo, _webHostEnvironment, _actionFactory);

            return await process.RebuildSite(staticSiteId);
        }
    }
}