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
using XStatic.Core.Generator.Markdown;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;

namespace XStatic.Core.Generator
{
    /// <summary>
    /// Generates static HTML pages alongside clean companion Markdown (.md) twins for LLMs and AI agents.
    /// </summary>
    public class StaticHtmlWithMarkdownSiteGenerator : StaticHtmlSiteGenerator
    {
        private readonly IHtmlToMarkdownConverter _markdownConverter;

        public StaticHtmlWithMarkdownSiteGenerator(
            IUmbracoContextFactory umbracoContextFactory,
            IPublishedUrlProvider publishedUrlProvider,
            IStaticSiteStorer storer,
            IImageCropNameGenerator imageCropNameGenerator,
            MediaFileManager mediaFileSystem,
            IWebHostEnvironment hostingEnvironment,
            ILogger<StaticHtmlSiteGenerator> logger,
            IOptions<XStaticGlobalSettings> globalSettings,
            IHtmlToMarkdownConverter markdownConverter = null)
            : base(umbracoContextFactory, publishedUrlProvider, storer, imageCropNameGenerator, mediaFileSystem, hostingEnvironment, logger, globalSettings)
        {
            _markdownConverter = markdownConverter ?? new HtmlToMarkdownConverter();
        }

        public override async Task<GenerateItemResult> GeneratePage(int id, int staticSiteId, IFileNameGenerator fileNamer, IEnumerable<ITransformer> transformers = null, string culture = null)
        {
            var node = GetNode(id);

            if (node == null || node.TemplateId == null)
            {
                return null;
            }

            try
            {
                var url = node.Url(_publishedUrlProvider, mode: UrlMode.Relative, culture: culture);
                string absoluteUrl = node.Url(_publishedUrlProvider, mode: UrlMode.Absolute, culture: culture);

                var fileData = await GetFileDataFromWebClient(absoluteUrl);
                Logger.LogInformation($"Downloaded page {url} from {absoluteUrl} with {fileData?.Length} chars of data");

                var transformedData = RunPageTransformers(fileData, transformers, url);
                Logger.LogInformation($"Transformed page {url} with {transformedData?.Length} chars of data");

                var filePath = fileNamer.GetFilePartialPath(url);
                var generatedFileLocation = await Store(staticSiteId, filePath, transformedData);

                if (!string.IsNullOrWhiteSpace(transformedData))
                {
                    try
                    {
                        var markdown = _markdownConverter.Convert(transformedData);
                        var markdownFilePath = MarkdownPathHelper.GetCompanionMarkdownPath(filePath);
                        await Store(staticSiteId, markdownFilePath, markdown);
                    }
                    catch (Exception mdEx)
                    {
                        Logger.LogWarning(mdEx, "Failed to generate companion Markdown for page {Url}", url);
                    }
                }

                return GenerateItemResult.Success("Page", node.UrlSegment, generatedFileLocation);
            }
            catch (Exception e)
            {
                Logger.LogError(e, $"Error generating page {node.UrlSegment}");
                return GenerateItemResult.Error("Page", node.UrlSegment, e.Message);
            }
        }

        protected string RunPageTransformers(string fileData, IEnumerable<ITransformer> transformers, string pageUrl)
        {
            if (transformers == null || fileData == null)
            {
                return fileData;
            }

            var context = GetContext();
            foreach (var transformer in transformers)
            {
                fileData = transformer is IPageContextTransformer pageAware
                    ? pageAware.Transform(fileData, context, pageUrl)
                    : transformer.Transform(fileData, context);
            }

            return fileData;
        }
    }
}
