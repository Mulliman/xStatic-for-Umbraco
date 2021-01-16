using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;
using System.Web.Razor.Generator;
using Umbraco.Core;
using Umbraco.Core.Models.PublishedContent;
using Umbraco.Core.PropertyEditors.ValueConverters;
using Umbraco.ModelsBuilder.Embedded;
using Umbraco.Web;
using Umbraco.Web.Models.ContentEditing;
using XStatic.Generator.Storage;
using XStatic.Generator.Transformers;

namespace XStatic.Generator
{

    public class StaticHtmlSiteGenerator : GeneratorBase, IStaticHtmlSiteGenerator
    {
        public StaticHtmlSiteGenerator(IUmbracoContextFactory umbracoContextFactory, IStaticSiteStorer storer, IImageCropNameGenerator imageCropNameGenerator) 
            : base(umbracoContextFactory, storer, imageCropNameGenerator)
        {
        }

        public override async Task<string> GeneratePage(int id, int staticSiteId, IFileNameGenerator fileNamer, IEnumerable<ITransformer> transformers = null)
        {
            var node = GetNode(id);

            if (node == null)
            {
                return null;
            }

            var url = node.Url(mode: UrlMode.Relative);
            string absoluteUrl = node.Url(mode: UrlMode.Absolute);

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
