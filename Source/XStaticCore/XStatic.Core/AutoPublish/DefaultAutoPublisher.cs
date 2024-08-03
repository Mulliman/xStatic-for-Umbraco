using Microsoft.AspNetCore.Hosting;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Umbraco.Cms.Core.Web;
using XStatic.Core.Actions;
using XStatic.Core.Deploy;
using XStatic.Core.Deploy.Processes;
using XStatic.Core.Deploy.Targets;
using XStatic.Core.Generator.ExportTypes;
using XStatic.Core.Generator.Processes;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Models;
using XStatic.Core.Repositories;

namespace XStatic.Core.AutoPublish
{
    public class DefaultAutoPublisher : IAutoPublisher
    {
        private readonly ISitesRepository _sitesRepository;
        private readonly IUmbracoContextFactory _umbracoContextFactory;
        private readonly IStaticSiteStorer _storer;
        private readonly IDeployerService _deployerService;
        private readonly IDeploymentTargetRepository _deploymentTargetRepository;
        private readonly IExportTypeService _exportTypeService;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly IActionFactory _actionFactory;

        public DefaultAutoPublisher(ISitesRepository sitesRepository,
            IUmbracoContextFactory umbracoContextFactory,
            IDeployerService deployerService,
            IDeploymentTargetRepository deploymentTargetRepository,
            IStaticSiteStorer storer,
            IExportTypeService exportTypeService,
            IWebHostEnvironment webHostEnvironment,
            IActionFactory actionFactory)
        {
            _sitesRepository = sitesRepository;
            _umbracoContextFactory = umbracoContextFactory;
            _storer = storer;
            _deployerService = deployerService;
            _deploymentTargetRepository = deploymentTargetRepository;
            _exportTypeService = exportTypeService;
            _webHostEnvironment = webHostEnvironment;
            _actionFactory = actionFactory;
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

            var process = new RebuildProcess(_umbracoContextFactory, _exportTypeService, _sitesRepository, _webHostEnvironment, _actionFactory);
            var deployProcess = new DeployProcess(_storer, _deploymentTargetRepository, _deployerService, _sitesRepository);

            foreach (var site in sitesToDeploy.Where(s => s.DeploymentTarget != null))
            {
                await process.RebuildSite(site.Id);
                await deployProcess.DeployStaticSite(site.Id);
            }
        }
    }
}