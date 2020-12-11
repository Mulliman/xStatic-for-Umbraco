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
        public StaticHtmlSiteGenerator(IUmbracoContextFactory umbracoContextFactory, IStaticSiteStorer storer) : base(umbracoContextFactory, storer)
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

            var fileData = await GetFileData(absoluteUrl);

            var transformedData = RunTransformers(fileData, transformers);

            var filePath = fileNamer.GetFilePartialPath(url);

            var generatedFileLocation = await Store(staticSiteId, filePath, transformedData);

            return generatedFileLocation;
        }

        protected async Task<string> GetFileData(string absoluteUrl)
        {
            try
            {
                if (absoluteUrl == null || absoluteUrl == "#") return null;

                string downloadedSource;

                using (var client = new System.Net.WebClient())
                {
                    client.Encoding = DefaultEncoder;

                    downloadedSource = await client.DownloadStringTaskAsync(absoluteUrl);
                }

                return downloadedSource;
            }
            catch (System.Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("error while publishing to file " + ex.Message);
                //throw;
            }

            return null;
        }
    }

//    [PublishedModel("Image")]
//    public partial class Image : PublishedContentModel
//    {
//        // helpers
//#pragma warning disable 0109 // new is redundant
//        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
//        public new const string ModelTypeAlias = "Image";
//        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
//        public new const PublishedItemType ModelItemType = PublishedItemType.Media;
//        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
//        public new static IPublishedContentType GetModelContentType()
//            => PublishedModelUtility.GetModelContentType(ModelItemType, ModelTypeAlias);
//        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
//        public static IPublishedPropertyType GetModelPropertyType<TValue>(Expression<Func<Image, TValue>> selector)
//            => PublishedModelUtility.GetModelPropertyType(GetModelContentType(), selector);
//#pragma warning restore 0109

//        // ctor
//        public Image(IPublishedContent content)
//            : base(content)
//        { }

//        // properties

//        ///<summary>
//        /// Size: in bytes
//        ///</summary>
//        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
//        [ImplementPropertyType("umbracoBytes")]
//        public long UmbracoBytes => this.Value<long>("umbracoBytes");

//        ///<summary>
//        /// Type
//        ///</summary>
//        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
//        [ImplementPropertyType("umbracoExtension")]
//        public string UmbracoExtension => this.Value<string>("umbracoExtension");

//        ///<summary>
//        /// Upload image
//        ///</summary>
//        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
//        [ImplementPropertyType("umbracoFile")]
//        public global::Umbraco.Core.PropertyEditors.ValueConverters.ImageCropperValue UmbracoFile => this.Value<global::Umbraco.Core.PropertyEditors.ValueConverters.ImageCropperValue>("umbracoFile");

//        ///<summary>
//        /// Height: in pixels
//        ///</summary>
//        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
//        [ImplementPropertyType("umbracoHeight")]
//        public int UmbracoHeight => this.Value<int>("umbracoHeight");

//        ///<summary>
//        /// Width: in pixels
//        ///</summary>
//        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
//        [ImplementPropertyType("umbracoWidth")]
//        public int UmbracoWidth => this.Value<int>("umbracoWidth");
//    }

//    /// <summary>File</summary>
//    [PublishedModel("File")]
//    public partial class File : PublishedContentModel
//    {
//        // helpers
//#pragma warning disable 0109 // new is redundant
//        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
//        public new const string ModelTypeAlias = "File";
//        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
//        public new const PublishedItemType ModelItemType = PublishedItemType.Media;
//        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
//        public new static IPublishedContentType GetModelContentType()
//            => PublishedModelUtility.GetModelContentType(ModelItemType, ModelTypeAlias);
//        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
//        public static IPublishedPropertyType GetModelPropertyType<TValue>(Expression<Func<File, TValue>> selector)
//            => PublishedModelUtility.GetModelPropertyType(GetModelContentType(), selector);
//#pragma warning restore 0109

//        // ctor
//        public File(IPublishedContent content)
//            : base(content)
//        { }

//        // properties

//        ///<summary>
//        /// Size: in bytes
//        ///</summary>
//        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
//        [ImplementPropertyType("umbracoBytes")]
//        public long UmbracoBytes => this.Value<long>("umbracoBytes");

//        ///<summary>
//        /// Type
//        ///</summary>
//        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
//        [ImplementPropertyType("umbracoExtension")]
//        public string UmbracoExtension => this.Value<string>("umbracoExtension");

//        ///<summary>
//        /// Upload file
//        ///</summary>
//        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
//        [ImplementPropertyType("umbracoFile")]
//        public string UmbracoFile => this.Value<string>("umbracoFile");
//    }
}
