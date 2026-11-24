using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Web;

using XStatic.Core.App;
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
		private readonly IOptions<XStaticGlobalSettings> _globalSettings;
		private readonly ILogger<DefaultAutoPublisher> _logger;
		private readonly IReadOnlyList<IAutoPublishSiteResolver> _siteResolvers;
		private readonly IEntityService _entityService;

		public DefaultAutoPublisher(ISitesRepository sitesRepository,
			IUmbracoContextFactory umbracoContextFactory,
			IDeployerService deployerService,
			IDeploymentTargetRepository deploymentTargetRepository,
			IStaticSiteStorer storer,
			IExportTypeService exportTypeService,
			IWebHostEnvironment webHostEnvironment,
			IActionFactory actionFactory,
			IOptions<XStaticGlobalSettings> globalSettings,
			ILogger<DefaultAutoPublisher> logger)
			: this(sitesRepository, umbracoContextFactory, deployerService, deploymentTargetRepository, storer, exportTypeService, webHostEnvironment, actionFactory, globalSettings, logger, System.Array.Empty<IAutoPublishSiteResolver>())
		{
		}

		public DefaultAutoPublisher(ISitesRepository sitesRepository,
			IUmbracoContextFactory umbracoContextFactory,
			IDeployerService deployerService,
			IDeploymentTargetRepository deploymentTargetRepository,
			IStaticSiteStorer storer,
			IExportTypeService exportTypeService,
			IWebHostEnvironment webHostEnvironment,
			IActionFactory actionFactory,
			IOptions<XStaticGlobalSettings> globalSettings,
			ILogger<DefaultAutoPublisher> logger,
			IEnumerable<IAutoPublishSiteResolver> siteResolvers)
			: this(sitesRepository, umbracoContextFactory, deployerService, deploymentTargetRepository, storer, exportTypeService, webHostEnvironment, actionFactory, globalSettings, logger, siteResolvers, entityService: null)
		{
		}

		public DefaultAutoPublisher(ISitesRepository sitesRepository,
			IUmbracoContextFactory umbracoContextFactory,
			IDeployerService deployerService,
			IDeploymentTargetRepository deploymentTargetRepository,
			IStaticSiteStorer storer,
			IExportTypeService exportTypeService,
			IWebHostEnvironment webHostEnvironment,
			IActionFactory actionFactory,
			IOptions<XStaticGlobalSettings> globalSettings,
			ILogger<DefaultAutoPublisher> logger,
			IEnumerable<IAutoPublishSiteResolver> siteResolvers,
			IEntityService entityService)
		{
			_entityService = entityService;
			_sitesRepository = sitesRepository;
			_umbracoContextFactory = umbracoContextFactory;
			_storer = storer;
			_deployerService = deployerService;
			_deploymentTargetRepository = deploymentTargetRepository;
			_exportTypeService = exportTypeService;
			_webHostEnvironment = webHostEnvironment;
			_actionFactory = actionFactory;
			_globalSettings = globalSettings;
			_logger = logger;

			var resolvers = siteResolvers?.ToList();
			_siteResolvers = resolvers != null && resolvers.Count > 0
				? resolvers
				: new List<IAutoPublishSiteResolver> { new PathBasedAutoPublishSiteResolver() };
		}

		public async Task RunAutoPublish(IEnumerable<Umbraco.Cms.Core.Models.IContent> publishedEntities)
		{
			var autoPublishSites = _sitesRepository.GetAutoPublishSites()?.ToList();

			if (autoPublishSites == null || !autoPublishSites.Any())
			{
				return;
			}

			var publishedList = publishedEntities?.ToList() ?? new List<IContent>();
			if (!publishedList.Any())
			{
				return;
			}

			var autoPublishSiteItems = GetAutoPublishSiteItems(autoPublishSites);
			var sitesToDeploy = ResolveAffectedSites(publishedList, autoPublishSites, autoPublishSiteItems);

			var process = new RebuildProcess(_umbracoContextFactory, _exportTypeService, _sitesRepository, _webHostEnvironment, _actionFactory, _globalSettings, _logger, _entityService);
			var deployProcess = new DeployProcess(_storer, _deploymentTargetRepository, _deployerService, _sitesRepository);

			foreach (var site in sitesToDeploy.Where(s => s.DeploymentTarget != null))
			{
				await process.RebuildSite(site.Id);
				var deployResult = await deployProcess.DeployStaticSite(site.Id);

				if (deployResult != null && !deployResult.WasSuccessful)
				{
					_logger?.LogError(deployResult.Exception, "xStatic auto publish couldn't deploy site {SiteId}: {Message}", site.Id, deployResult.Message);
				}
			}
		}

		public List<ExtendedGeneratedSite> ResolveAffectedSites(
			IReadOnlyCollection<IContent> publishedEntities,
			IReadOnlyCollection<ExtendedGeneratedSite> autoPublishSites,
			IReadOnlyDictionary<int, IPublishedContent> autoPublishSiteItems)
		{
			var sitesToDeploy = new List<ExtendedGeneratedSite>();
			var seenSiteIds = new HashSet<int>();

			foreach (var resolver in _siteResolvers)
			{
				if (seenSiteIds.Count >= autoPublishSites.Count)
				{
					break;
				}

				var resolved = resolver.ResolveAffectedSites(publishedEntities, autoPublishSites, autoPublishSiteItems);
				if (resolved == null)
				{
					continue;
				}

				foreach (var site in resolved)
				{
					if (site != null && seenSiteIds.Add(site.Id))
					{
						sitesToDeploy.Add(site);
					}
				}
			}

			return sitesToDeploy;
		}

		private Dictionary<int, IPublishedContent> GetAutoPublishSiteItems(IEnumerable<ExtendedGeneratedSite> autoPublishSites)
		{
			using var umbracoContext = _umbracoContextFactory.EnsureUmbracoContext();
			var items = new Dictionary<int, IPublishedContent>();

			foreach (var site in autoPublishSites)
			{
				try
				{
					var rootNode = umbracoContext.UmbracoContext.Content.GetById(site.RootNode);
					items.Add(site.Id, rootNode);
				}
				catch
				{
					// Swallow for now, should probably warn the user or log this if it works.
				}
			}

			return items;
		}
	}
}