using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.BackOffice.Controllers;
using Umbraco.Cms.Web.Common.Attributes;
using XStatic.Core.Generator.ExportTypes;
using XStatic.Core.Generator.Processes;
using XStatic.Core.Repositories;

namespace XStatic.Controllers
{
    [PluginController("xstatic")]
    public class GenerateController : UmbracoAuthorizedJsonController
    {
        private readonly IUmbracoContextFactory _umbracoContextFactory;
        private readonly IExportTypeService _exportTypeService;
        private ISitesRepository _sitesRepo;
        private IWebHostEnvironment _webHostEnvironment;

        public GenerateController(
            IUmbracoContextFactory umbracoContextFactory,
            IExportTypeService exportTypeService,
            ISitesRepository sitesRepository,
            IWebHostEnvironment webHostEnvironment)
        {
            _umbracoContextFactory = umbracoContextFactory;
            _exportTypeService = exportTypeService;
            _sitesRepo = sitesRepository;
            _webHostEnvironment = webHostEnvironment;
        }

        [HttpGet]
        public async Task<string> RebuildStaticSite(int staticSiteId)
        {
            var process = new RebuildProcess(_umbracoContextFactory, _exportTypeService, _sitesRepo, _webHostEnvironment);

            return await process.RebuildSite(staticSiteId);
        }
    }
}