using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Hosting;
using Umbraco.Web;
using XStatic.Generator;
using XStatic.Generator.Storage;
using XStatic.Generator.Transformers;
using XStatic.Plugin.Repositories;
using XStatic.Plugin.ExportType;
using XStatic.Library;

namespace XStatic.Plugin.Processes
{
    public class RebuildProcess
    {
        private readonly IUmbracoContextFactory _umbracoContextFactory;
        private readonly IExportTypeSettings _exportTypeSettings;
        private SitesRepository _sitesRepo;

        public RebuildProcess(IUmbracoContextFactory umbracoContextFactory,
            IExportTypeSettings exportTypeSettings)
        {
            _umbracoContextFactory = umbracoContextFactory;
            _exportTypeSettings = exportTypeSettings;
            _sitesRepo = new SitesRepository();
        }

        public async Task<string> RebuildSite(int staticSiteId)
        {
            var stopwatch = new Stopwatch();
            stopwatch.Start();

            var entity = _sitesRepo.Get(staticSiteId);

            if (entity == null)
            {
                throw new HttpException(404, "Site not found with id " + staticSiteId);
            }

            using(var umbracoContext = _umbracoContextFactory.EnsureUmbracoContext())
            {
                IFileNameGenerator fileNamer = entity.ExportFormat == "api" ? (IFileNameGenerator)new JsonFileNameGenerator() : new EverythingIsIndexHtmlFileNameGenerator();

                int rootNodeId = int.Parse(entity.RootNode);
                var rootNode = umbracoContext.UmbracoContext.Content.GetById(rootNodeId);

                var builder = new JobBuilder(entity.Id, fileNamer)
                    .AddPageWithDescendants(rootNode);

                AddMediaToBuilder(entity, umbracoContext, builder);
                AddMediaCropsToBuilder(entity, builder);

                AddAssetsToBuilder(entity, builder);

                var listFactory = _exportTypeSettings.GetTransformerListFactory(entity.ExportFormat);
                var transformers = listFactory.BuildTransformers(entity);

                if(transformers.Any())
                {
                    builder.AddTransformers(transformers);
                }

                var results = await GetResults(entity, builder);

                stopwatch.Stop();

                _sitesRepo.UpdateLastRun(staticSiteId, (int)(stopwatch.ElapsedMilliseconds / 1000));

                return string.Join(Environment.NewLine, results);
            }
        }

        private async Task<List<string>> GetResults(GeneratedSite entity, JobBuilder builder)
        {
            var results = new List<string>();

            var generator = _exportTypeSettings.GetGenerator(entity.ExportFormat);

            if(generator == null)
            {
                throw new Exception("Export format not supported");
            }

            var job = builder.Build();
            var runner = new JobRunner(generator);
            results.AddRange(await runner.RunJob(job));

            return results;
        }

        private static void AddAssetsToBuilder(GeneratedSite entity, JobBuilder builder)
        {
            if (!string.IsNullOrEmpty(entity.AssetPaths))
            {
                var splitPaths = entity.AssetPaths.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
                var rootPath = HostingEnvironment.MapPath("~/");

                foreach (var path in splitPaths)
                {
                    var absolutePath = FileHelpers.PathCombine(rootPath, path);

                    if(path.Contains("?") || path.Contains("*"))
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

        private static void AddMediaToBuilder(GeneratedSite entity, UmbracoContextReference umbracoContext, JobBuilder builder)
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

        private void AddMediaCropsToBuilder(GeneratedSite entity, JobBuilder builder)
        {
            if(string.IsNullOrEmpty(entity.ImageCrops))
            {
                return;
            }

            var crops = Crop.GetCropsFromCommaDelimitedString(entity.ImageCrops);
            builder.AddMediaCrops(crops);
        }
    }
}