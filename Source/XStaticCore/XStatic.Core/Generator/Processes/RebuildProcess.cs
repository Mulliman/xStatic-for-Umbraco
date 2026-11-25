using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using XStatic.Core.App;
using XStatic.Core.AutoPublish;

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Web;
using XStatic.Core.Actions;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.ExportTypes;
using XStatic.Core.Generator.Jobs;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Helpers;
using XStatic.Core.Repositories;

namespace XStatic.Core.Generator.Processes
{
    public class RebuildProcess
    {
        private readonly IUmbracoContextFactory _umbracoContextFactory;
        private readonly IExportTypeService _exportTypeService;
        private readonly ISitesRepository _sitesRepo;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly IActionFactory _actionFactory;
        private readonly IOptions<XStaticGlobalSettings> _globalSettings;
        private readonly ILogger _logger;

        /// <summary>
        /// Creates the process.
        /// </summary>
        /// <param name="entityService">
        /// Lists the media under each media root from the database. If null, it's resolved from the application's
        /// services, and if that fails the published cache is used, which can miss media on a site's first boot.
        /// </param>
        public RebuildProcess(IUmbracoContextFactory umbracoContextFactory,
            IExportTypeService exportTypeService,
            ISitesRepository repo,
            IWebHostEnvironment webHostEnvironment,
            IActionFactory actionFactory,
            IOptions<XStaticGlobalSettings> globalSettings,
            ILogger logger,
            IEntityService entityService)
        {
            _umbracoContextFactory = umbracoContextFactory;
            _exportTypeService = exportTypeService;
            _sitesRepo = repo;
            _webHostEnvironment = webHostEnvironment;
            _actionFactory = actionFactory;
            _globalSettings = globalSettings;
            _logger = logger;
            _entityService = entityService;
        }

        private IEntityService _entityService;
        private bool _entityServiceLookedUp;

        /// <summary>
        /// The entity service passed in, or else the application's. Only looked up once.
        /// </summary>
        private IEntityService EntityService
        {
            get
            {
                if (_entityService != null || _entityServiceLookedUp)
                {
                    return _entityService;
                }

                _entityServiceLookedUp = true;
                Exception error = null;

                try
                {
                    _entityService = StaticServiceProvider.Instance?.GetService<IEntityService>();
                }
                catch (Exception e)
                {
                    error = e;
                }

                if (_entityService == null)
                {
                    _logger?.LogWarning(error, "xStatic could not get IEntityService, so media will be listed from the published cache. On a new site's first boot that can miss media. Create RebuildProcess with an IEntityService to avoid this.");
                }

                return _entityService;
            }
        }

        public async Task<RebuildProcessResult> RebuildSite(int staticSiteId)
        {
            var stopwatch = new Stopwatch();
            stopwatch.Start();

            var entity = _sitesRepo.Get<SiteConfig>(staticSiteId);

            if (entity?.ExportFormat == null)
            {
                throw new XStaticException("Site not found with id " + staticSiteId);
            }

            using (var umbracoContext = _umbracoContextFactory.EnsureUmbracoContext())
            {
                try
                {
                    IFileNameGenerator fileNamer = _exportTypeService.GetFileNameGenerator(entity.ExportFormat);

                    var rootNode = umbracoContext.UmbracoContext.Content.GetById(entity.RootNode);

                    var builder = new JobBuilder(entity.Id, fileNamer);

                    // Exclude certain types?
                    if (_globalSettings?.Value?.ExcludeGeneratingDocTypes != null && _globalSettings.Value.ExcludeGeneratingDocTypes.Any())
                    {
                        var excludedTypeAliases = _globalSettings.Value.ExcludeGeneratingDocTypes.ToList();

                        _logger?.LogInformation("xStatic excluding document types: {ExcludedTypes}", string.Join(", ", excludedTypeAliases));
                        builder.AddPageWithDescendantsWithoutTypes(rootNode, excludedTypeAliases);
                    }
                    else // All descendants will be included
                    {
                        builder.AddPageWithDescendants(rootNode);
                    }

                    AddCulturesToBuilder(entity, builder);

                    AddMediaToBuilder(entity, umbracoContext, builder);
                    AddMediaCropsToBuilder(entity, builder);

                    var assetResults = AddAssetsToBuilder(entity, builder);

                    var listFactory = _exportTypeService.GetTransformerListFactory(entity.ExportFormat);
                    var transformers = listFactory.BuildTransformers(entity);

                    if (transformers.Any())
                    {
                        builder.AddTransformers(transformers);
                    }

                    var results = await GetResults(entity, builder);
                    results.AddRange(assetResults);

                    var postActionResults = await RunPostActions(entity);
                    results.AddRange(postActionResults);

                    stopwatch.Stop();

                    _sitesRepo.UpdateLastRun(staticSiteId, (int)(stopwatch.ElapsedMilliseconds / 1000));

                    return new RebuildProcessResult
                    {
                        SiteId = staticSiteId,
                        BuildTime = stopwatch.ElapsedMilliseconds,
                        WasSuccessful = results.All(r => r.WasSuccessful),
                        Results = results
                    };
                }
                catch (Exception e)
                {
                    _logger?.LogError(e, "xStatic failed to generate site {SiteName} ({SiteId})", entity.Name, staticSiteId);

                    return new RebuildProcessResult
                    {
                        SiteId = staticSiteId,
                        Exception = e.Message,
                        ExceptionTrace = e.StackTrace,
                        WasSuccessful = false
                    };
                }
            }
        }

        private void AddCulturesToBuilder(SiteConfig entity, JobBuilder builder)
        {
            if (entity?.Cultures?.Any() != true)
            {
                return;
            }

            foreach(var culture in entity.Cultures)
            {
                builder.AddCulture(culture);
            }
        }

        private async Task<List<GenerateItemResult>> GetResults(SiteConfig entity, JobBuilder builder)
        {
            var results = new List<GenerateItemResult>();

            var generator = _exportTypeService.GetGenerator(entity.ExportFormat) ?? throw new Exception("Export format not supported");

            var job = builder.Build();
            var runner = new JobRunner(generator);
            results.AddRange(await runner.RunJob(job));

            return results;
        }

        private List<GenerateItemResult> AddAssetsToBuilder(SiteConfig entity, JobBuilder builder)
        {
            var resolver = new AssetPathResolver(_webHostEnvironment.WebRootPath, _webHostEnvironment.ContentRootPath, _logger);

            return resolver.AddAssetsToBuilder(entity.AssetPaths, builder);
        }

        private void AddMediaToBuilder(SiteConfig entity, UmbracoContextReference umbracoContext, JobBuilder builder)
        {
            if (!string.IsNullOrEmpty(entity.MediaRootNodes))
            {
                var mediaRoots = entity.MediaRootNodes.Split(new[] { "," }, StringSplitOptions.RemoveEmptyEntries);

                foreach (var mediaRoot in mediaRoots)
                {

                    if (Guid.TryParse(mediaRoot, out Guid mediaId))
                    {
                        var rootMedia = umbracoContext.UmbracoContext.Media.GetById(mediaId);

                        if (rootMedia != null)
                        {
                            AddMediaWithDescendants(rootMedia, builder);
                        }
                    }
                }
            }
        }

        /// <summary>
        /// Adds a media item and everything under it. The descendants are listed from the database, because the
        /// published cache's navigation can be missing media: on the first boot of a new site, media created by a
        /// package migration (such as a starter kit's) isn't in it until the site restarts.
        /// </summary>
        private void AddMediaWithDescendants(IPublishedContent rootMedia, JobBuilder builder)
        {
            IEnumerable<int> descendantIds = null;

            try
            {
                descendantIds = EntityService?.GetDescendants(rootMedia.Id, UmbracoObjectTypes.Media)
                    .Where(x => !x.Trashed)
                    .Select(x => x.Id)
                    .ToList();
            }
            catch (Exception e)
            {
                _logger?.LogWarning(e, "xStatic could not list the media under {MediaId} from the database; using the published cache instead", rootMedia.Id);
            }

            if (descendantIds == null)
            {
                builder.AddMediaWithDescendants(rootMedia);
                return;
            }

            builder.AddMedia(rootMedia);
            builder.AddMediaIds(descendantIds);
        }

        private void AddMediaCropsToBuilder(SiteConfig entity, JobBuilder builder)
        {
            if (string.IsNullOrEmpty(entity.ImageCrops))
            {
                return;
            }

            var crops = Crop.GetCropsFromCommaDelimitedString(entity.ImageCrops);
            builder.AddMediaCrops(crops);
        }

        private static string GetFailureMessage(XStaticResult result)
        {
            if (result == null)
            {
                return "Action returned no result.";
            }

            var message = string.IsNullOrWhiteSpace(result.Message) ? "Action failed." : result.Message;

            return result.Exception == null ? message : $"{message} {result.Exception.Message}";
        }

        private async Task<IEnumerable<GenerateItemResult>> RunPostActions(SiteConfig entity)
        {
            var actionIds = entity?.PostGenerationActionIds?.ToArray();

            if (actionIds?.Any() != true)
            {
                return new List<GenerateItemResult>();
            }

            var actions = _actionFactory.CreateConfiguredPostGenerationActions(actionIds);
            var results = new List<GenerateItemResult>();

            foreach(var action in actions.Where(a => a?.Action != null))
            {
                try
                {
                    var result = await action.Action.RunAction(entity.Id, action.Config);

                    // Actions report failure by returning an error rather than throwing, so every action
                    // still runs and all problems are listed at the end.
                    var convertedResult = result?.WasSuccessful == true
                        ? GenerateItemResult.Success("PostAction", action.Name, "Completed")
                        : GenerateItemResult.Error("PostAction", action.Name, GetFailureMessage(result));
                    results.Add(convertedResult);
                }
                catch (Exception e)
                {
                    var convertedResult = GenerateItemResult.Error("PostAction", action.Name, e.Message);
                    results.Add(convertedResult);
                }
            }

            return results;
        }
    }
}