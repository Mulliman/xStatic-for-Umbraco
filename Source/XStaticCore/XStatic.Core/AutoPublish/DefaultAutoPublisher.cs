using Microsoft.AspNetCore.Hosting;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Umbraco.Cms.Core.Web;
using XStatic.Core.Actions;
using XStatic.Core.Deploy;
using XStatic.Core.Deploy.Processes;
using XStatic.Core.Generator.ExportTypes;
using XStatic.Core.Generator.Processes;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Models;
using XStatic.Core.Repositories;

namespace XStatic.Core.AutoPublish
{
	using Microsoft.Extensions.Logging;
	using Microsoft.Extensions.Options;
	using XStatic.Core.App;
	using XStatic.Core.Generator;

	public class DefaultAutoPublisher : IAutoPublisher
    {
        private readonly ISitesRepository _sitesRepository;
        private readonly IUmbracoContextFactory _umbracoContextFactory;
        private readonly IStaticSiteStorer _storer;
        private readonly IDeployerService _deployerService;
        private readonly IExportTypeService _exportTypeService;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly IActionFactory _actionFactory;
        private readonly IOptions<XStaticGlobalSettings> _globalSettings;
        private readonly ILogger<DefaultAutoPublisher> _logger;

        public DefaultAutoPublisher(ISitesRepository sitesRepository,
            IUmbracoContextFactory umbracoContextFactory,
            IDeployerService deployerService,
            IStaticSiteStorer storer,
            IExportTypeService exportTypeService,
            IWebHostEnvironment webHostEnvironment,
            IActionFactory actionFactory,
            IOptions<XStaticGlobalSettings> globalSettings,
            ILogger<DefaultAutoPublisher> logger)
        {
            _sitesRepository = sitesRepository;
            _umbracoContextFactory = umbracoContextFactory;
            _storer = storer;
            _deployerService = deployerService;
            _exportTypeService = exportTypeService;
            _webHostEnvironment = webHostEnvironment;
            _actionFactory = actionFactory;
            _globalSettings = globalSettings;
            _logger = logger;
        }

        public async Task RunAutoPublish(IEnumerable<Umbraco.Cms.Core.Models.IContent> publishedEntities)
        {
            var autoPublishSites = _sitesRepository.GetAutoPublishSites();

            var sitesToDeploy = new List<ExtendedGeneratedSite>();

            foreach (var publishedItem in publishedEntities)
            {
                foreach (var site in autoPublishSites)
                {
                    if (sitesToDeploy.Contains(site))
                    {
                        continue;
                    }

                    if (publishedItem.Path.Contains($",{site.RootNode},") || publishedItem.Path.EndsWith($",{site.RootNode}"))
                    {
                        sitesToDeploy.Add(site);
                    }
                }
            }

            var process = new RebuildProcess(_umbracoContextFactory, _exportTypeService, _sitesRepository, _webHostEnvironment, _actionFactory,_globalSettings,_logger);
            var deployProcess = new DeployProcess(_storer, _deployerService, _sitesRepository);

            foreach (var site in sitesToDeploy.Where(s => s.DeploymentTarget != null))
            {
                await process.RebuildSite(site.Id);
                await deployProcess.DeployStaticSite(site.Id);
            }
        }
    }
}