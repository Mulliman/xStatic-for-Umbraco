using System.Collections.Generic;
using System.Threading.Tasks;
using XStatic.Generator.Ssl;
using XStatic.Generator.Storage;
using XStatic.Generator.Transformers;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Hosting;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Extensions;
using XStatic.Generator;

namespace XStatic.Core.Generator
{
    public class StaticHtmlSiteGenerator : GeneratorBase
    {
        public StaticHtmlSiteGenerator(IUmbracoContextFactory umbracoContextFactory,
            IPublishedUrlProvider publishedUrlProvider,
            IStaticSiteStorer storer,
            IImageCropNameGenerator imageCropNameGenerator,
            MediaFileManager mediaFileSystem,
            IHostingEnvironment hostingEnvironment) 
            : base(umbracoContextFactory, publishedUrlProvider, storer, imageCropNameGenerator, mediaFileSystem, hostingEnvironment)
        {
        }

        public override async Task<string> GeneratePage(int id, int staticSiteId, IFileNameGenerator fileNamer, IEnumerable<ITransformer> transformers = null)
        {
            SslTruster.TrustSslIfAppSettingConfigured();

            var node = GetNode(id);

            if (node == null)
            {
                return null;
            }

            var url = node.Url(_publishedUrlProvider, mode: UrlMode.Relative);
            string absoluteUrl = node.Url(_publishedUrlProvider, mode: UrlMode.Absolute);

            var fileData = await GetFileDataFromWebClient(absoluteUrl);

            if(fileData == null)
            {
                return null;
            }

            var transformedData = RunTransformers(fileData, transformers);

            var filePath = fileNamer.GetFilePartialPath(url);

            var generatedFileLocation = await Store(staticSiteId, filePath, transformedData);

            return generatedFileLocation;
        }
    }
}