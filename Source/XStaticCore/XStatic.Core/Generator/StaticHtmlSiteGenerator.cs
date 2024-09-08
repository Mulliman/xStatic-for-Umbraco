using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Web;
using Umbraco.Extensions;
using XStatic.Core.App;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;

namespace XStatic.Core.Generator
{
    public class StaticHtmlSiteGenerator : GeneratorBase
    {
        public StaticHtmlSiteGenerator(IUmbracoContextFactory umbracoContextFactory,
            IPublishedUrlProvider publishedUrlProvider,
            IStaticSiteStorer storer,
            IImageCropNameGenerator imageCropNameGenerator,
            MediaFileManager mediaFileSystem,
            IWebHostEnvironment hostingEnvironment,
            ILogger<StaticHtmlSiteGenerator> logger,
            IOptions<XStaticGlobalSettings> globalSettings
            )
            : base(umbracoContextFactory, publishedUrlProvider, storer, imageCropNameGenerator, mediaFileSystem, hostingEnvironment, globalSettings, logger)
        {
        }

        public override async Task<GenerateItemResult> GeneratePage(int id, int staticSiteId, IFileNameGenerator fileNamer, IEnumerable<ITransformer> transformers = null, string culture = null)
        {
            var node = GetNode(id);

            if (node == null)
            {
                return null;
            }
            if (node.TemplateId== null)
            {
                return null;
            }
            try
            {
                var url = node.Url(_publishedUrlProvider, mode: UrlMode.Relative, culture: culture);
                string absoluteUrl = node.Url(_publishedUrlProvider, mode: UrlMode.Absolute, culture: culture);

                var fileData = await GetFileDataFromWebClient(absoluteUrl);
                Logger.LogInformation($"Downloaded page {url} from {absoluteUrl} with {fileData?.Length} chars of data");

                var transformedData = RunTransformers(fileData, transformers);
                Logger.LogInformation($"Transformed page {url} with {transformedData?.Length} chars of data");

                var filePath = fileNamer.GetFilePartialPath(url);

                var generatedFileLocation = await Store(staticSiteId, filePath, transformedData);

                return GenerateItemResult.Success("Page", node.UrlSegment, generatedFileLocation);
            }
            catch (Exception e)
            {
                Logger.LogError(e, $"Error generating page {node.UrlSegment}");
                return GenerateItemResult.Error("Page", node.UrlSegment, e.Message);
            }
        }
    }
}