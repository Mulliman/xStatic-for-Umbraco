using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Hosting;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PropertyEditors.ValueConverters;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Web;
using Umbraco.Extensions;
using XStatic.Core.Generator.Ssl;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;
using XStatic.Core.Helpers;

namespace XStatic.Core.Generator
{
    public abstract class GeneratorBase : IGenerator
    {
        protected readonly string[] ResizeExtensions = new[] { "jpg", "jpeg", "png", "gif" };

        protected static readonly Encoding DefaultEncoder = Encoding.UTF8;

        protected IUmbracoContextFactory _umbracoContextFactory;
        protected readonly IPublishedUrlProvider _publishedUrlProvider;
        protected readonly IStaticSiteStorer _storer;
        protected readonly IImageCropNameGenerator _imageCropNameGenerator;
        protected readonly MediaFileManager _mediaFileSystem;
        private readonly IHostingEnvironment _hostingEnvironment;

        protected NoopPublishedValueFallback _fallback = new NoopPublishedValueFallback();

        protected GeneratorBase(IUmbracoContextFactory umbracoContextFactory,
            IPublishedUrlProvider publishedUrlProvider,
            IStaticSiteStorer storer,
            IImageCropNameGenerator imageCropNameGenerator,
            MediaFileManager mediaFileSystem,
            IHostingEnvironment hostingEnvironment)
        {
            _umbracoContextFactory = umbracoContextFactory;
            _publishedUrlProvider = publishedUrlProvider;
            _storer = storer;
            _imageCropNameGenerator = imageCropNameGenerator;
            _mediaFileSystem = mediaFileSystem;
            _hostingEnvironment = hostingEnvironment;
        }

        public virtual async Task<IEnumerable<string>> GenerateFolder(string folderPath, int staticSiteId)
        {
            var partialPath = folderPath;
            var absolutePath = _hostingEnvironment.MapPathContentRoot(partialPath);

            var files = Directory.GetFiles(absolutePath);
            var created = new List<string>();

            foreach (var file in files)
            {
                var outputPath = Path.Combine(partialPath, Path.GetFileName(file));
                var generatedFileLocation = await Copy(staticSiteId, file, outputPath);

                created.Add(generatedFileLocation);
            }

            return created;
        }

        public virtual async Task<string> GenerateFile(string partialPath, int staticSiteId)
        {
            var rootPath = _hostingEnvironment.MapPathContentRoot("~/");
            var absolutePath = FileHelpers.PathCombine(rootPath, partialPath);

            var generatedFileLocation = await Copy(staticSiteId, absolutePath, partialPath);

            return generatedFileLocation;
        }

        public virtual async Task<string> GenerateMedia(int id, int staticSiteId, IEnumerable<Crop> crops = null)
        {
            var mediaItem = GetMedia(id);

            if (mediaItem == null)
            {
                return null;
            }

            var url = mediaItem.Url(_publishedUrlProvider);
            string absoluteUrl = mediaItem.Url(_publishedUrlProvider, mode: UrlMode.Absolute);

            var partialPath = GetRelativeMediaPath(mediaItem);

            if (string.IsNullOrEmpty(partialPath))
            {
                return null;
            }

            var mediaFileStream = _mediaFileSystem.FileSystem.OpenFile(partialPath);

            var generatedFileLocation = await Save(staticSiteId, mediaFileStream, partialPath);

            if (crops?.Any() == true)
            {
                var fileName = Path.GetFileName(partialPath);
                var fileExtension = Path.GetExtension(partialPath)?.ToLower();
                var pathSegment = partialPath.Replace(fileName, string.Empty);

                if (ResizeExtensions.Contains(fileExtension.Trim('.')))
                {
                    foreach (var crop in crops)
                    {
                        var query = $"?mode=max&width={crop.Width ?? 0}&height={crop.Height ?? 0}";
                        var cropUrl = absoluteUrl + query;

                        var newName = _imageCropNameGenerator.GetCropFileName(Path.GetFileNameWithoutExtension(partialPath), crop);
                        var newPath = Path.Combine(pathSegment, newName + fileExtension);

                        var destinationPath = _storer.GetFileDestinationPath(staticSiteId.ToString(), newPath);
                        await SaveFileDataFromWebClient(cropUrl, destinationPath);
                    }
                }
            }

            return generatedFileLocation;
        }

        public abstract Task<string> GeneratePage(int id, int staticSiteId, IFileNameGenerator fileNamer, IEnumerable<ITransformer> transformers = null);

        protected string RunTransformers(string fileData, IEnumerable<ITransformer> transformers)
        {
            if (transformers == null) return fileData;

            var context = GetContext();
            foreach (var transformer in transformers)
            {
                fileData = transformer.Transform(fileData, context);
            }

            return fileData;
        }

        protected async Task<string> Store(int staticSiteId, string filePath, string fileData)
        {
            return await _storer.StoreSiteItem(staticSiteId.ToString(), filePath, fileData, DefaultEncoder);
        }

        protected async Task<string> Copy(int staticSiteId, string absoluteFilePath, string filePath)
        {
            return await _storer.CopyFile(staticSiteId.ToString(), absoluteFilePath, filePath);
        }

        protected async Task<string> Save(int staticSiteId, Stream stream, string filePath)
        {
            return await _storer.SaveFile(staticSiteId.ToString(), stream, filePath);
        }

        protected IUmbracoContext GetContext()
        {
            using (var umbracoContextReference = _umbracoContextFactory.EnsureUmbracoContext())
            {
                return umbracoContextReference.UmbracoContext;
            }
        }

        protected IPublishedContent GetNode(int id)
        {
            using (var umbracoContextReference = _umbracoContextFactory.EnsureUmbracoContext())
            {
                var content = umbracoContextReference.UmbracoContext.Content;
                return content.GetById(id);
            }
        }

        protected IPublishedContent GetMedia(int id)
        {
            using (var umbracoContextReference = _umbracoContextFactory.EnsureUmbracoContext())
            {
                var media = umbracoContextReference.UmbracoContext.Media;
                return media.GetById(id);
            }
        }

        protected string GetRelativeMediaPath(IPublishedContent mediaItem)
        {
            if (!mediaItem.HasProperty(Constants.Conventions.Media.File))
            {
                return null;
            }

            var prop = mediaItem.GetProperty(Constants.Conventions.Media.File);

            var umbracoFileSource = prop?.Value<ImageCropperValue>(_fallback)?.Src;

            if (umbracoFileSource == null)
            {
                umbracoFileSource = prop?.Value<string>(_fallback);

                if (umbracoFileSource == null)
                {
                    return null;
                }
            }

            var relativeFilePath = umbracoFileSource;

            return relativeFilePath;
        }

        protected async Task<string> GetFileDataFromWebClient(string absoluteUrl)
        {
            SslTruster.TrustSslIfAppSettingConfigured();

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
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("error while publishing to file " + ex.Message);
                //throw;
            }

            return null;
        }

        protected async Task<string> SaveFileDataFromWebClient(string absoluteUrl, string filePath)
        {
            SslTruster.TrustSslIfAppSettingConfigured();

            try
            {
                if (absoluteUrl == null || absoluteUrl == "#") return null;

                using (var client = new System.Net.WebClient())
                {
                    client.Encoding = DefaultEncoder;

                    await client.DownloadFileTaskAsync(new Uri(absoluteUrl), filePath);
                }

                return filePath;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("error while publishing to file " + ex.Message);
                //throw;
            }

            return null;
        }
    }
}