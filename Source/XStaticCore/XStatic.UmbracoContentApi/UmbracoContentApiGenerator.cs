using Microsoft.AspNetCore.Hosting;
using Newtonsoft.Json;
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
using UmbracoContentApi.Core.Resolvers;
using XStatic.Core.Generator;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;

namespace XStatic.UmbracoContentApi
{
    public class UmbracoContentApiGenerator : GeneratorBase
    {
        private readonly Lazy<IContentResolver> _contentResolver;

        public UmbracoContentApiGenerator(IUmbracoContextFactory umbracoContextFactory,
            IPublishedUrlProvider publishedUrlProvider,
            IStaticSiteStorer storer,
            IImageCropNameGenerator imageCropNameGenerator,
            MediaFileManager mediaFileSystem,
            IWebHostEnvironment hostingEnvironment,
            IOptions<XStaticGlobalSettings> settings,
			ILogger<GeneratorBase> logger,
            Lazy<IContentResolver> contentResolver)
            : base(umbracoContextFactory, publishedUrlProvider, storer, imageCropNameGenerator, mediaFileSystem, hostingEnvironment, settings, logger)
        {
            _contentResolver = contentResolver;
        }

        public override async Task<GenerateItemResult> GeneratePage(int id, int staticSiteId, IFileNameGenerator fileNamer, IEnumerable<ITransformer> transformers = null)
        {
            //SslTruster.TrustSslIfAppSettingConfigured();

            var node = GetNode(id);

            if (node == null)
            {
                return null;
            }

            try
            {
                var url = node.Url(_publishedUrlProvider, mode: UrlMode.Relative);

                var model = _contentResolver.Value.ResolveContent(node);

                var fileData = JsonConvert.SerializeObject(model);

                var transformedData = RunTransformers(fileData, transformers);

                var filePath = fileNamer.GetFilePartialPath(url);

                var generatedFileLocation = await Store(staticSiteId, filePath, transformedData);

                return GenerateItemResult.Success("Page", node.UrlSegment,  generatedFileLocation);
            }
            catch (Exception e)
            {
                return GenerateItemResult.Error("Page", node.UrlSegment, e.Message);
            }
        }
    }
}