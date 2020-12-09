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
using Umbraco.Web.Editors;
using Umbraco.Web.Mvc;
using Umbraco.Web.WebApi;
using XStatic.Generator;
using XStatic.Generator.Storage;
using XStatic.Generator.Transformers;
using XStatic.Plugin.Repositories;

namespace XStatic.Plugin.Controllers
{
    [PluginController("xstatic")]
    public class GenerateController : UmbracoAuthorizedJsonController
    {
        private readonly IStaticHtmlSiteGenerator _htmlGenerator;
        private readonly IApiGenerator _apiGenerator;
        private SitesRepository _sitesRepo;

        public GenerateController(IStaticHtmlSiteGenerator htmlGenerator, IApiGenerator apiGenerator)
        {
            _htmlGenerator = htmlGenerator;
            _apiGenerator = apiGenerator;
            _sitesRepo = new SitesRepository();
        }

        [HttpGet]
        public async Task<string> Test()
        {
            var fileNamer = new EverythingIsIndexHtmlFileNameGenerator();
            var transformers = new[] { new CachedTimeTransformer() };

            var rootNode = Umbraco.Content(1104);
            var rootMedia = Umbraco.Media(1129);

            var jobBuilder = new JobBuilder(1, fileNamer)
                .AddPageWithDescendants(rootNode)
                .AddMediaWithDescendants(rootMedia)
                .AddAssetFolder("/css")
                .AddAssetFile("/scripts/umbraco-starterkit-app.js")
                .AddTransformer(new CachedTimeTransformer());

            //var generatedFile = await _htmlGenerator.Generate(1104, 1, fileNamer, transformers);

            var jobRunner = new JobRunner(_htmlGenerator);

            var generatedPages = await jobRunner.RunJob(jobBuilder.Build());

            return string.Join(Environment.NewLine, generatedPages);
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
            var stopwatch = new Stopwatch();
            stopwatch.Start();

            var entity = _sitesRepo.Get(staticSiteId);

            if(entity == null)
            {
                throw new HttpException(404, "Site not found with id " + staticSiteId);
            }

            IFileNameGenerator fileNamer = entity.ExportFormat == "api" ? (IFileNameGenerator)new JsonFileNameGenerator() : new EverythingIsIndexHtmlFileNameGenerator();

            var rootNode = Umbraco.Content(entity.RootNode);

            var builder = new JobBuilder(entity.Id, fileNamer)
                .AddPageWithDescendants(rootNode);

            if (!string.IsNullOrEmpty(entity.MediaRootNodes))
            {
                var mediaRoots = entity.MediaRootNodes.Split(new[] { "," }, StringSplitOptions.RemoveEmptyEntries);

                foreach(var mediaRoot in mediaRoots)
                {
                    var rootMedia = Umbraco.Media(mediaRoot);

                    if(rootMedia != null)
                    {
                        builder.AddMediaWithDescendants(rootMedia);
                    }
                }
            }
            
            if(!string.IsNullOrEmpty(entity.AssetPaths))
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
                    else if(System.IO.File.Exists(absolutePath))
                    {
                        builder.AddAssetFolder(path);
                    }
                    else
                    {
                        // Invalid file.
                    }
                }                
            }

            var results = new List<string>();

            if(entity.ExportFormat == "api")
            {
                builder.AddTransformer((new UmbracoContentUdiToJsonUrlTransformer()));

                var job = builder.Build();
                var runner = new JobRunner(_apiGenerator);
                results.AddRange(await runner.RunJob(job));
            }
            else if (entity.ExportFormat == "html")
            {
                builder.AddTransformer((new CachedTimeTransformer()));

                var job = builder.Build();
                var runner = new JobRunner(_htmlGenerator);
                results.AddRange(await runner.RunJob(job));
            }
            else
            {
                throw new Exception("Export format not supported");
            }

            stopwatch.Stop();

            _sitesRepo.UpdateLastRun(staticSiteId, (int)(stopwatch.ElapsedMilliseconds / 1000));

            return string.Join(Environment.NewLine, results);
        }
    }
}