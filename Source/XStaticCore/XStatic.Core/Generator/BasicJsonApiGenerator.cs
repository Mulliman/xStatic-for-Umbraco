using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Web;
using Umbraco.Extensions;
using XStatic.Core.App;
using XStatic.Core.Generator;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;

namespace XStatic.Generator
{
    public class BasicJsonApiGenerator : GeneratorBase
    {
        public BasicJsonApiGenerator(IUmbracoContextFactory umbracoContextFactory,
            IPublishedUrlProvider publishedUrlProvider,
            IStaticSiteStorer storer,
            IImageCropNameGenerator imageCropNameGenerator,
            MediaFileManager mediaFileSystem,
            IWebHostEnvironment hostingEnvironment,
            IOptions<XStaticGlobalSettings> settings,
            ILogger<GeneratorBase> logger)
            : base(umbracoContextFactory, publishedUrlProvider, storer, imageCropNameGenerator, mediaFileSystem, hostingEnvironment, settings, logger)
        {
        }

        public override async Task<GenerateItemResult> GeneratePage(int id, int staticSiteId, IFileNameGenerator fileNamer, IEnumerable<ITransformer> transformers = null, string culture = null)
        {
            var node = GetNode(id);

            if (node == null)
            {
                return null;
            }

            try
            {
                var url = node.Url(_publishedUrlProvider, mode: UrlMode.Relative, culture: culture);
                var fileData = GetJsonData(node);

                var transformedData = RunTransformers(fileData, transformers);

                var filePath = fileNamer.GetFilePartialPath(url);

                var generatedFileLocation = await Store(staticSiteId, filePath, transformedData);

                return GenerateItemResult.Success("Page", node.UrlSegment, generatedFileLocation);
            }
            catch (Exception e)
            {
                return GenerateItemResult.Error("Page", node.UrlSegment, e.Message);
            }            
        }

        protected virtual string GetJsonData(IPublishedContent content)
        {
            var obj = new JObject();

            obj.Add("_DISCLAIMER_", "This is a basic auto generated API built using an early version of xStatic. To customise the output you can override GetJsonData in JsonApiGenerator.");
            obj.Add("_GENERATED_ON_", DateTime.Now);
            obj.Add("__id", content.Id);
            obj.Add("__name", content.Name);
            obj.Add("__contentTypeAlias", content.ContentType.Alias);
            obj.Add("__contentTypeId", content.ContentType.Id);
            obj.Add("__createDate", content.CreateDate);
            obj.Add("__updateDate", content.UpdateDate);
            obj.Add("__level", content.Level);
            obj.Add("__parent", content.Parent != null ? content.Parent.Id : (int?)null);
            obj.Add("__path", content.Path);
            obj.Add("__templateId", content.TemplateId);
            obj.Add("__writerId", content.WriterId);

            foreach (var prop in content.Properties)
            {
                var jsonVal = content.Value<JToken>(_fallback, prop.Alias);
                if (jsonVal != null)
                {
                    obj.Add(prop.Alias, jsonVal);
                }
                else
                {
                    var array = content.Value<IEnumerable<string>>(_fallback, prop.Alias);

                    if (array != null)
                    {
                        obj.Add(prop.Alias, new JArray(array));
                    }
                    else
                    {
                        obj.Add(prop.Alias, prop.GetSourceValue() as string);
                    }
                }
            }

            return obj.ToString();
        }
    }
}
