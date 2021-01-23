using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Umbraco.Core.Composing;
using Umbraco.Core.Scoping;
using Umbraco.Core.Services.Implement;
using Umbraco.Web;
using XStatic.Deploy;
using XStatic.Generator;
using XStatic.Generator.Storage;
using XStatic.Plugin.Controllers;
using XStatic.Plugin.ExportType;
using XStatic.Plugin.Processes;
using XStatic.Plugin.Repositories;

namespace XStatic.Plugin.AutoPublish
{
    public class XStaticOnPublishAutoDeployComponent : IComponent
    {
        private readonly SitesRepository _sitesRepository;
        private readonly IUmbracoContextFactory _umbracoContextFactory;
        private readonly IStaticSiteStorer _storer;
        private readonly IDeployerFactory _deployerFactory;
        private readonly IImageCropNameGenerator _imageCropNameGenerator;
        private readonly IExportTypeSettings _exportTypeSettings;

        public XStaticOnPublishAutoDeployComponent(SitesRepository sitesRepository,
            IUmbracoContextFactory umbracoContextFactory,
            IStaticSiteStorer storer,
            IDeployerFactory deployerFactory,
            IImageCropNameGenerator imageCropNameGenerator,
            IExportTypeSettings exportTypeSettings)
        {
            _sitesRepository = sitesRepository;
            _umbracoContextFactory = umbracoContextFactory;
            _storer = storer;
            _deployerFactory = deployerFactory;
            _imageCropNameGenerator = imageCropNameGenerator;
            _exportTypeSettings = exportTypeSettings;
        }

        // initialize: runs once when Umbraco starts
        public void Initialize()
        {
            ContentService.Published += ContentService_Published;
        }

        private void ContentService_Published(Umbraco.Core.Services.IContentService sender, Umbraco.Core.Events.ContentPublishedEventArgs e)
        {
            var autoPublishSites = _sitesRepository.GetAutoPublishSites();

            var sitesToDeploy = new List<ExtendedGeneratedSite>();

            foreach (var publishedItem in e.PublishedEntities)
            {
                foreach(var site in autoPublishSites)
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

            //var context = _umbracoContext.EnsureUmbracoContext();
            var process = new RebuildProcess(_umbracoContextFactory, _exportTypeSettings);
            var deployProcess = new DeployProcess(_storer, _deployerFactory, _sitesRepository);

            foreach(var site in sitesToDeploy)
            {
                //process.RebuildSite(site.Id);
                Task.Run(async () => {
                    await process.RebuildSite(site.Id);
                    await deployProcess.DeployStaticSite(site.Id);
                    }); 
            }   
        }

        // terminate: runs once when Umbraco stops
        public void Terminate()
        {
            // do something when Umbraco terminates
        }
    }
}