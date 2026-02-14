using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PropertyEditors.ValueConverters;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Web;
using Umbraco.Extensions;
using XStatic.Core.App;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;
using XStatic.Core.Helpers;

namespace XStatic.Core.Generator
{
    public abstract class GeneratorBase : IGenerator
    {
        protected readonly string[] ResizeExtensions = new[] { "jpg", "jpeg", "png", "gif", "webp" };

        protected static readonly Encoding DefaultEncoder = Encoding.UTF8;

        protected IUmbracoContextFactory _umbracoContextFactory;
        protected readonly IPublishedUrlProvider _publishedUrlProvider;
        protected readonly IStaticSiteStorer _storer;
        protected readonly IImageCropNameGenerator _imageCropNameGenerator;
        protected readonly MediaFileManager _mediaFileSystem;
        private readonly IWebHostEnvironment _hostingEnvironment;
        private readonly IOptions<XStaticGlobalSettings> _globalSettings;
        protected readonly HttpClient HttpClient;
        protected ILogger<GeneratorBase> Logger { get; }

        protected NoopPublishedValueFallback _fallback = new NoopPublishedValueFallback();

        protected GeneratorBase(IUmbracoContextFactory umbracoContextFactory,
            IPublishedUrlProvider publishedUrlProvider,
            IStaticSiteStorer storer,
            IImageCropNameGenerator imageCropNameGenerator,
            MediaFileManager mediaFileSystem,
            IWebHostEnvironment hostingEnvironment,
            IOptions<XStaticGlobalSettings> globalSettings,
            ILogger<GeneratorBase> logger)
        {
            _umbracoContextFactory = umbracoContextFactory;
            _publishedUrlProvider = publishedUrlProvider;
            _storer = storer;
            _imageCropNameGenerator = imageCropNameGenerator;
            _mediaFileSystem = mediaFileSystem;
            _hostingEnvironment = hostingEnvironment;
            _globalSettings = globalSettings;
            Logger = logger;
            if (_globalSettings?.Value?.TrustSslWhenGenerating == true)
            {
                var handler = new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = (message, cert, chain, errors) => true
                };

                HttpClient = new HttpClient(handler);
            }
            else
            {
                HttpClient = new HttpClient();
            }            
        }

        public virtual async Task<IEnumerable<GenerateItemResult>> GenerateFolder(string absolutePath, string relativePath, int staticSiteId)
        {
            var files = Directory.GetFiles(absolutePath);
            var created = new List<GenerateItemResult>();

            foreach (var file in files)
            {
                var outputPath = Path.Combine(relativePath, Path.GetFileName(file));

                try
                {
                    var generatedFileLocation = await Copy(staticSiteId, file, outputPath);

                    created.Add(GenerateItemResult.Success("Folder", outputPath, generatedFileLocation));
                }
                catch (Exception e)
                {
                    Logger.LogError(e, "Error generating file {file}", file);
                    created.Add(GenerateItemResult.Error("Folder", outputPath, e.Message));
                }
            }

            return created;
        }

        public virtual async Task<GenerateItemResult> GenerateFile(string absolutePath, string relativePath, int staticSiteId)
        {
            try
            {
                var generatedFileLocation = await Copy(staticSiteId, absolutePath, relativePath);

                return GenerateItemResult.Success("File", relativePath, generatedFileLocation);
            }
            catch (Exception e)
            {
                Logger.LogError(e, "Error generating file {relativePath}", relativePath);
                return GenerateItemResult.Error("File", relativePath, e.Message);
            }
        }

        public virtual async Task<GenerateItemResult> GenerateMedia(int id, int staticSiteId, IEnumerable<Crop> crops = null)
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

            try
            {
                var mediaFileStream = _mediaFileSystem.FileSystem.OpenFile(partialPath);

                var generatedFileLocation = await Save(staticSiteId, mediaFileStream, partialPath);

                if (crops?.Any() == true)
                {
                    var fileName = Path.GetFileName(partialPath);
                    var fileExtension = Path.GetExtension(partialPath)?.ToLower();
                    var pathSegment = partialPath.Replace(fileName, string.Empty);

                    if (CanFileTypeBeCropped(fileExtension))
                    {
                        foreach (var crop in crops)
                        {
                            var query = crop.QualityPercentage.HasValue && crop.QualityPercentage.Value > 0
                                ? $"?mode=max&width={crop.Width ?? 0}&height={crop.Height ?? 0}&quality={crop.QualityPercentage}"
                                : $"?mode=max&width={crop.Width ?? 0}&height={crop.Height ?? 0}";
                            var cropUrl = absoluteUrl + query;

                            var newName = _imageCropNameGenerator.GetCropFileName(Path.GetFileNameWithoutExtension(partialPath), crop);
                            var newPath = Path.Combine(pathSegment, newName + fileExtension);

                            var destinationPath = _storer.GetFileDestinationPath(staticSiteId.ToString(), newPath);
                            await SaveFileDataFromWebClient(cropUrl, destinationPath);
                        }
                    }
                }

                return GenerateItemResult.Success("Media", partialPath, generatedFileLocation);
            }
            catch (Exception e)
            {
                Logger.LogError(e, "Error generating media {partialPath}", partialPath);
                return GenerateItemResult.Error("Media", partialPath, e.Message);
            }
        }

        public abstract Task<GenerateItemResult> GeneratePage(int id, int staticSiteId, IFileNameGenerator fileNamer, IEnumerable<ITransformer> transformers = null, string culture = null);

        protected string RunTransformers(string fileData, IEnumerable<ITransformer> transformers)
        {
            if (transformers == null) return fileData;

            if (fileData==null) return fileData;
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

        protected virtual bool CanFileTypeBeCropped(string fileExtension)
        {
            return ResizeExtensions.Contains(fileExtension.Trim('.'));
        }

        protected virtual async Task<string> GetFileDataFromWebClient(string absoluteUrl)
        {
            try
            {
                if (absoluteUrl == null || absoluteUrl == "#") return null;
                Logger.LogDebug("Generating static HTML for page at {UrlPath}", absoluteUrl);


                string downloadedSource = await HttpClient.GetStringAsync(absoluteUrl);
                Logger.LogDebug("Length of Static HTML for page at {UrlPath}: {Length} chars", absoluteUrl, downloadedSource.Length);

                return downloadedSource;
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Error while downloading file from {absoluteUrl}", absoluteUrl);
                System.Diagnostics.Debug.WriteLine("error while publishing to file " + ex.Message);
            }

            return null;
        }

        protected async Task<string> SaveFileDataFromWebClient(string absoluteUrl, string filePath)
        {
            try
            {
                if (absoluteUrl == null || absoluteUrl == "#") return null;

                using (var stream = await HttpClient.GetStreamAsync(absoluteUrl))
                using (var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None, 8192, true))
                {
                    await stream.CopyToAsync(fileStream);
                }

                return filePath;
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Error while downloading file from {absoluteUrl}", absoluteUrl);
                System.Diagnostics.Debug.WriteLine("error while publishing to file " + ex.Message);
                //throw;
            }

            return null;
        }
    }
}