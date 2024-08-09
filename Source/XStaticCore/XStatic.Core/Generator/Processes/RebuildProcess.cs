using Microsoft.AspNetCore.Hosting;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Umbraco.Cms.Core;
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

        public RebuildProcess(IUmbracoContextFactory umbracoContextFactory,
            IExportTypeService exportTypeService,
            ISitesRepository repo,
            IWebHostEnvironment webHostEnvironment,
            IActionFactory actionFactory)
        {
            _umbracoContextFactory = umbracoContextFactory;
            _exportTypeService = exportTypeService;
            _sitesRepo = repo;
            _webHostEnvironment = webHostEnvironment;
            _actionFactory = actionFactory;
        }

        public async Task<RebuildProcessResult> RebuildSite(int staticSiteId)
        {
            var stopwatch = new Stopwatch();
            stopwatch.Start();

            Thread.Sleep(5000);

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

                    var builder = new JobBuilder(entity.Id, fileNamer)
                        .AddPageWithDescendants(rootNode);

                    AddCulturesToBuilder(entity, builder);

                    AddMediaToBuilder(entity, umbracoContext, builder);
                    AddMediaCropsToBuilder(entity, builder);

                    AddAssetsToBuilder(entity, builder);

                    var listFactory = _exportTypeService.GetTransformerListFactory(entity.ExportFormat);
                    var transformers = listFactory.BuildTransformers(entity);

                    if (transformers.Any())
                    {
                        builder.AddTransformers(transformers);
                    }

                    var results = await GetResults(entity, builder);

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

        private void AddAssetsToBuilder(SiteConfig entity, JobBuilder builder)
        {
            if (!string.IsNullOrEmpty(entity.AssetPaths))
            {
                var splitPaths = entity.AssetPaths.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries).Select(p => p.Trim());
                var rootPath = _webHostEnvironment.WebRootPath;

                foreach (var path in splitPaths)
                {
                    var absolutePath = FileHelpers.PathCombine(rootPath, path);

                    if (path.Contains("?") || path.Contains("*"))
                    {
                        var trimmedPath = path.TrimStart(new[] { '\\', '/' });

                        var directory = new DirectoryInfo(rootPath);
                        var files = directory.GetFiles(trimmedPath, SearchOption.AllDirectories);

                        builder.AddAssetFiles(files.Select(f => "/" + FileHelpers.GetRelativePath(rootPath, f.FullName)));
                    }
                    else if (Directory.Exists(absolutePath))
                    {
                        builder.AddAssetFolder(path);
                    }
                    else if (System.IO.File.Exists(absolutePath))
                    {
                        builder.AddAssetFile(path);
                    }
                    else
                    {
                        // Invalid file.
                    }
                }
            }
        }

        private static void AddMediaToBuilder(SiteConfig entity, UmbracoContextReference umbracoContext, JobBuilder builder)
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
                            builder.AddMediaWithDescendants(rootMedia);
                        }
                    }
                }
            }
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

                    var convertedResult = GenerateItemResult.Success("PostAction", action.Name, "Completed");
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