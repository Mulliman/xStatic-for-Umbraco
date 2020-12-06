﻿using System;
using System.CodeDom;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Http;
using Umbraco.Web.Editors;
using Umbraco.Web.Mvc;
using Umbraco.Web.WebApi;
using XStatic.Generator;
using XStatic.Generator.Storage;
using XStatic.Generator.Transformers;

namespace XStatic.Plugin.Controllers
{
    [PluginController("xstatic")]
    public class GenerateController : UmbracoAuthorizedJsonController
    {
        private readonly IStaticHtmlSiteGenerator _htmlGenerator;

        public GenerateController(IStaticHtmlSiteGenerator htmlGenerator)
        {
            _htmlGenerator = htmlGenerator;
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

            var generatedFile = await _htmlGenerator.GeneratePages(nodeId, staticSiteId, fileNamer, transformers);

            return generatedFile;
        }
    }
}