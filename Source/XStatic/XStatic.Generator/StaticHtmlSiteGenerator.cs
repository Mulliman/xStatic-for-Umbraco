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
using Umbraco.Core.Composing;
using Umbraco.Core.Models.PublishedContent;
using Umbraco.Core.PropertyEditors.ValueConverters;
using Umbraco.ModelsBuilder.Embedded;
using Umbraco.Web;
using Umbraco.Web.Models.ContentEditing;
using XStatic.Generator.Storage;
using XStatic.Generator.Transformers;

namespace XStatic.Generator
{
    public class InstallerComposer : IUserComposer
    {
        public void Compose(Composition composition)
        {
            composition.Register<IStaticSiteStorer, AppDataSiteStorer>();
            composition.Register<IStaticHtmlSiteGenerator, StaticHtmlSiteGenerator>();
        }
    }

    public class StaticHtmlSiteGenerator : IStaticHtmlSiteGenerator
    {
        private static readonly Encoding DefaultEncoder = Encoding.UTF8;

        private IUmbracoContextFactory _umbracoContextFactory;
        private readonly IStaticSiteStorer _storer;

        public StaticHtmlSiteGenerator(IUmbracoContextFactory umbracoContextFactory, IStaticSiteStorer storer)
        {
            _umbracoContextFactory = umbracoContextFactory;
            _storer = storer;
        }

        public async Task<string> GeneratePage(int id, int staticSiteId, IFileNameGenerator fileNamer, IEnumerable<ITransformer> transformers = null)
        {
            var node = GetNode(id);

            if (node == null)
            {
                return null;
            }

            var url = node.Url();
            string absoluteUrl = node.Url(mode: UrlMode.Absolute);

            var fileData = await GetFileData(absoluteUrl);

            var transformedData = RunTransformers(fileData, transformers);

            var filePath = fileNamer.GetFilePartialPath(url);

            var generatedFileLocation = await Store(staticSiteId, filePath, transformedData);

            return generatedFileLocation;
        }

        public async Task<string> GenerateMedia(int id, int staticSiteId, IEnumerable<Crop> crops = null)
        {
            var mediaItem = GetMedia(id);

            if (mediaItem == null)
            {
                return null;
            }

            var url = mediaItem.Url();
            string absoluteUrl = mediaItem.Url(mode: UrlMode.Absolute);

            var partialPath = GetRelativeMediaPath(mediaItem);

            if(string.IsNullOrEmpty(partialPath))
            {
                return null;
            }

            var absolutePath = System.Web.Hosting.HostingEnvironment.MapPath(partialPath);

            var generatedFileLocation = await Copy(staticSiteId, absolutePath, partialPath);

            return generatedFileLocation;
        }

        public async Task<IEnumerable<string>> GenerateFolder(string folderPath, int staticSiteId)
        {
            var partialPath = folderPath;
            var absolutePath = System.Web.Hosting.HostingEnvironment.MapPath(partialPath);

            var files = Directory.GetFiles(absolutePath);
            var created = new List<string>();

            foreach(var file in files)
            {
                var outputPath = Path.Combine(partialPath, Path.GetFileName(file));
                var generatedFileLocation = await Copy(staticSiteId, file, outputPath);

                created.Add(generatedFileLocation);
            }
            
            return created;
        }

        public async Task<string> GenerateFile(string filePath, int staticSiteId)
        {
            var partialPath = filePath;
            var absolutePath = System.Web.Hosting.HostingEnvironment.MapPath(partialPath);

            var generatedFileLocation = await Copy(staticSiteId, absolutePath, partialPath);

            return generatedFileLocation;
        }

        private async Task<string> GetFileData(string absoluteUrl)
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

        private string RunTransformers(string fileData, IEnumerable<ITransformer> transformers)
        {
            if (transformers == null) return fileData;

            foreach(var transformer in transformers)
            {
                fileData = transformer.Transform(fileData);
            }

            return fileData;
        }

        private async Task<string> Store(int staticSiteId, string filePath, string fileData)
        {
            return await _storer.StoreSiteItem(staticSiteId.ToString(), filePath, fileData, DefaultEncoder);
        }

        private async Task<string> Copy(int staticSiteId, string absoluteFilePath, string filePath)
        {
            return await _storer.CopyFile(staticSiteId.ToString(), absoluteFilePath, filePath);
        }

        private IPublishedContent GetNode(int id)
        {
            using (var umbracoContextReference = _umbracoContextFactory.EnsureUmbracoContext())
            {
                var content = umbracoContextReference.UmbracoContext.Content;
                return content.GetById(id);
            }
        }

        private IPublishedContent GetMedia(int id)
        {
            using (var umbracoContextReference = _umbracoContextFactory.EnsureUmbracoContext())
            {
                var media = umbracoContextReference.UmbracoContext.Media;
                return media.GetById(id);
            }
        }

        private string GetRelativeMediaPath(IPublishedContent mediaItem)
        {
            if(!mediaItem.HasProperty(Constants.Conventions.Media.File))
            {
                return null;
            }

            var prop = mediaItem.GetProperty(Constants.Conventions.Media.File);

            var umbracoFileSource = prop?.Value<ImageCropperValue>()?.Src;

            if(umbracoFileSource == null)
            {
                umbracoFileSource = prop?.Value<string>();

                if (umbracoFileSource == null)
                {
                    return null;
                }
            }

            var relativeFilePath = umbracoFileSource;

            return relativeFilePath;
        }
    }

    [PublishedModel("Image")]
    public partial class Image : PublishedContentModel
    {
        // helpers
#pragma warning disable 0109 // new is redundant
        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
        public new const string ModelTypeAlias = "Image";
        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
        public new const PublishedItemType ModelItemType = PublishedItemType.Media;
        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
        public new static IPublishedContentType GetModelContentType()
            => PublishedModelUtility.GetModelContentType(ModelItemType, ModelTypeAlias);
        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
        public static IPublishedPropertyType GetModelPropertyType<TValue>(Expression<Func<Image, TValue>> selector)
            => PublishedModelUtility.GetModelPropertyType(GetModelContentType(), selector);
#pragma warning restore 0109

        // ctor
        public Image(IPublishedContent content)
            : base(content)
        { }

        // properties

        ///<summary>
        /// Size: in bytes
        ///</summary>
        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
        [ImplementPropertyType("umbracoBytes")]
        public long UmbracoBytes => this.Value<long>("umbracoBytes");

        ///<summary>
        /// Type
        ///</summary>
        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
        [ImplementPropertyType("umbracoExtension")]
        public string UmbracoExtension => this.Value<string>("umbracoExtension");

        ///<summary>
        /// Upload image
        ///</summary>
        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
        [ImplementPropertyType("umbracoFile")]
        public global::Umbraco.Core.PropertyEditors.ValueConverters.ImageCropperValue UmbracoFile => this.Value<global::Umbraco.Core.PropertyEditors.ValueConverters.ImageCropperValue>("umbracoFile");

        ///<summary>
        /// Height: in pixels
        ///</summary>
        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
        [ImplementPropertyType("umbracoHeight")]
        public int UmbracoHeight => this.Value<int>("umbracoHeight");

        ///<summary>
        /// Width: in pixels
        ///</summary>
        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
        [ImplementPropertyType("umbracoWidth")]
        public int UmbracoWidth => this.Value<int>("umbracoWidth");
    }

    /// <summary>File</summary>
    [PublishedModel("File")]
    public partial class File : PublishedContentModel
    {
        // helpers
#pragma warning disable 0109 // new is redundant
        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
        public new const string ModelTypeAlias = "File";
        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
        public new const PublishedItemType ModelItemType = PublishedItemType.Media;
        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
        public new static IPublishedContentType GetModelContentType()
            => PublishedModelUtility.GetModelContentType(ModelItemType, ModelTypeAlias);
        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
        public static IPublishedPropertyType GetModelPropertyType<TValue>(Expression<Func<File, TValue>> selector)
            => PublishedModelUtility.GetModelPropertyType(GetModelContentType(), selector);
#pragma warning restore 0109

        // ctor
        public File(IPublishedContent content)
            : base(content)
        { }

        // properties

        ///<summary>
        /// Size: in bytes
        ///</summary>
        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
        [ImplementPropertyType("umbracoBytes")]
        public long UmbracoBytes => this.Value<long>("umbracoBytes");

        ///<summary>
        /// Type
        ///</summary>
        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
        [ImplementPropertyType("umbracoExtension")]
        public string UmbracoExtension => this.Value<string>("umbracoExtension");

        ///<summary>
        /// Upload file
        ///</summary>
        [global::System.CodeDom.Compiler.GeneratedCodeAttribute("Umbraco.ModelsBuilder.Embedded", "8.9.1")]
        [ImplementPropertyType("umbracoFile")]
        public string UmbracoFile => this.Value<string>("umbracoFile");
    }
}
