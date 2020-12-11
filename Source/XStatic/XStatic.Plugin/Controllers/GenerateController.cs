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
using XStatic.Plugin.Processes;
using XStatic.Plugin.Repositories;

namespace XStatic.Plugin.Controllers
{
    [PluginController("xstatic")]
    public class GenerateController : UmbracoAuthorizedJsonController
    {
        private readonly IStaticHtmlSiteGenerator _htmlGenerator;
        private readonly IApiGenerator _apiGenerator;
        private readonly IUmbracoContextFactory _umbracoContextFactory;
        private SitesRepository _sitesRepo;

        public GenerateController(IStaticHtmlSiteGenerator htmlGenerator, IApiGenerator apiGenerator, IUmbracoContextFactory umbracoContextFactory)
        {
            _htmlGenerator = htmlGenerator;
            _apiGenerator = apiGenerator;
            _umbracoContextFactory = umbracoContextFactory;
            _sitesRepo = new SitesRepository();
        }

        [HttpGet]
        public async Task<string> GenerateStaticPage(int nodeId, int staticSiteId)
        {
            var fileNamer = new EverythingIsIndexHtmlFileNameGenerator();
            var transformers = new[] { new CachedTimeTransformer() };

            var generatedFile = await _htmlGenerator.GeneratePage(nodeId, staticSiteId, fileNamer, transformers);

            return generatedFile;
        }

        [HttpGet]
        public async Task<string> RebuildStaticSite(int staticSiteId)
        {
            var process = new RebuildProcess(_htmlGenerator, _apiGenerator, _umbracoContextFactory);

            return await process.RebuildSite(staticSiteId);
        }
    }
}