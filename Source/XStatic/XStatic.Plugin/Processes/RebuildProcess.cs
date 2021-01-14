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

namespace XStatic.Plugin.Processes
{
    public class RebuildProcess
    {
        private readonly IStaticHtmlSiteGenerator _htmlGenerator;
        private readonly IApiGenerator _apiGenerator;
        private readonly IUmbracoContextFactory _umbracoContextFactory;
        private SitesRepository _sitesRepo;

        public RebuildProcess(IStaticHtmlSiteGenerator htmlGenerator, IApiGenerator apiGenerator, IUmbracoContextFactory umbracoContextFactory)
        {
            _htmlGenerator = htmlGenerator;
            _apiGenerator = apiGenerator;
            _umbracoContextFactory = umbracoContextFactory;
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
                AddAssetsToBuilder(entity, builder);

                var results = await GetResults(entity, builder);

                stopwatch.Stop();

                _sitesRepo.UpdateLastRun(staticSiteId, (int)(stopwatch.ElapsedMilliseconds / 1000));

                return string.Join(Environment.NewLine, results);
            }
        }

        private async Task<List<string>> GetResults(GeneratedSite entity, JobBuilder builder)
        {
            var results = new List<string>();

            if (entity.ExportFormat == "api")
            {
                builder.AddTransformer((new UmbracoContentUdiToJsonUrlTransformer()));

                var job = builder.Build();
                var runner = new JobRunner(_apiGenerator);
                results.AddRange(await runner.RunJob(job));
            }
            else if (entity.ExportFormat == "html")
            {
                builder.AddTransformer((new CachedTimeTransformer()));
                
                if(!string.IsNullOrEmpty(entity.TargetHostname))
                {
                    builder.AddTransformer(new HostnameTransformer(entity.TargetHostname));
                }
                
                var job = builder.Build();
                var runner = new JobRunner(_htmlGenerator);
                results.AddRange(await runner.RunJob(job));
            }
            else
            {
                throw new Exception("Export format not supported");
            }

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
                    var absolutePath = Utils.PathCombine(rootPath, path);

                    if (Directory.Exists(absolutePath))
                    {
                        builder.AddAssetFolder(path);
                    }
                    else if (System.IO.File.Exists(absolutePath))
                    {
                        builder.AddAssetFolder(path);
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
    }
}