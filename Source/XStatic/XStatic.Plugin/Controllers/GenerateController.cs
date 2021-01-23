using System;
using System.CodeDom;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Hosting;
using System.Web.Http;
using Umbraco.Web;
using Umbraco.Web.Editors;
using Umbraco.Web.Mvc;
using Umbraco.Web.WebApi;
using XStatic.Generator;
using XStatic.Generator.Storage;
using XStatic.Generator.Transformers;
using XStatic.Plugin.ExportType;
using XStatic.Plugin.Processes;
using XStatic.Plugin.Repositories;

namespace XStatic.Plugin.Controllers
{
    [PluginController("xstatic")]
    public class GenerateController : UmbracoAuthorizedJsonController
    {
        private readonly IUmbracoContextFactory _umbracoContextFactory;
        private readonly IExportTypeSettings _exportTypeSettings;
        private SitesRepository _sitesRepo;

        public GenerateController(
            IUmbracoContextFactory umbracoContextFactory,
            IExportTypeSettings exportTypeSettings)
        {
            _umbracoContextFactory = umbracoContextFactory;
            _exportTypeSettings = exportTypeSettings;
            _sitesRepo = new SitesRepository();
        }

        [HttpGet]
        public async Task<string> RebuildStaticSite(int staticSiteId)
        {
            var process = new RebuildProcess(_umbracoContextFactory, _exportTypeSettings);

            return await process.RebuildSite(staticSiteId);
        }
    }
}