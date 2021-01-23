using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Umbraco.Core.Models.PublishedContent;
using Umbraco.Web;
using XStatic.Generator.Storage;
using XStatic.Generator.Transformers;

namespace XStatic.Generator
{
    public class JsonApiGenerator : GeneratorBase
    {
        public JsonApiGenerator(IUmbracoContextFactory umbracoContextFactory, IStaticSiteStorer storer, IImageCropNameGenerator imageCropNameGenerator) 
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
            var fileData = GetJsonData(node);

            var transformedData = RunTransformers(fileData, transformers);

            var filePath = fileNamer.GetFilePartialPath(url);

            var generatedFileLocation = await Store(staticSiteId, filePath, transformedData);

            return generatedFileLocation;
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
            obj.Add("__writerName", content.WriterName);

            foreach(var prop in content.Properties)
            {
                var jsonVal = content.Value<JToken>(prop.Alias);
                if (jsonVal != null)
                {
                    obj.Add(prop.Alias, jsonVal);
                }
                else
                {
                    var array = content.Value<IEnumerable<string>>(prop.Alias);

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
