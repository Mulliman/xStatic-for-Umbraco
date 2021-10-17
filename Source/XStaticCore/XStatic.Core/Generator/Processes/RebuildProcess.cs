using Microsoft.AspNetCore.Hosting;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Web;
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
        private ISitesRepository _sitesRepo;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public RebuildProcess(IUmbracoContextFactory umbracoContextFactory,
            IExportTypeService exportTypeService,
            ISitesRepository repo,
            IWebHostEnvironment webHostEnvironment)
        {
            _umbracoContextFactory = umbracoContextFactory;
            _exportTypeService = exportTypeService;
            _sitesRepo = repo;
            _webHostEnvironment = webHostEnvironment;
        }

        public async Task<string> RebuildSite(int staticSiteId)
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
                IFileNameGenerator fileNamer = _exportTypeService.GetFileNameGenerator(entity.ExportFormat);

                int rootNodeId = entity.RootNode;
                var rootNode = umbracoContext.UmbracoContext.Content.GetById(rootNodeId);

                var builder = new JobBuilder(entity.Id, fileNamer)
                    .AddPageWithDescendants(rootNode);

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

                stopwatch.Stop();

                _sitesRepo.UpdateLastRun(staticSiteId, (int)(stopwatch.ElapsedMilliseconds / 1000));

                return string.Join(Environment.NewLine, results);
            }
        }

        private async Task<List<string>> GetResults(SiteConfig entity, JobBuilder builder)
        {
            var results = new List<string>();

            var generator = _exportTypeService.GetGenerator(entity.ExportFormat);

            if (generator == null)
            {
                throw new Exception("Export format not supported");
            }

            var job = builder.Build();
            var runner = new JobRunner(generator);
            results.AddRange(await runner.RunJob(job));

            return results;
        }

        private void AddAssetsToBuilder(SiteConfig entity, JobBuilder builder)
        {
            if (!string.IsNullOrEmpty(entity.AssetPaths))
            {
                var splitPaths = entity.AssetPaths.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
                var rootPath = _webHostEnvironment.ContentRootPath;

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
                    int mediaId;

                    if (int.TryParse(mediaRoot, out mediaId))
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
    }
}