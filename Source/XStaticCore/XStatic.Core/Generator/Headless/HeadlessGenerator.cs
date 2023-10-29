using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Org.BouncyCastle.Bcpg.Sig;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Web;
using Umbraco.Extensions;
using XStatic.Core.Generator.Ssl;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;

namespace XStatic.Core.Generator.Headless
{
    public class HeadlessGenerator
    {
        protected static readonly Encoding DefaultEncoder = Encoding.UTF8;

        protected IUmbracoContextFactory _umbracoContextFactory;
        protected readonly IPublishedUrlProvider _publishedUrlProvider;
        protected readonly IStaticSiteStorer _storer;
        protected readonly IImageCropNameGenerator _imageCropNameGenerator;
        protected readonly MediaFileManager _mediaFileSystem;
        private readonly IWebHostEnvironment _hostingEnvironment;
        private readonly IServer _server;
        protected readonly HttpClient HttpClient;

        public Uri BaseUri { get; }

        protected NoopPublishedValueFallback _fallback = new NoopPublishedValueFallback();

        protected HeadlessGenerator(IUmbracoContextFactory umbracoContextFactory,
            IPublishedUrlProvider publishedUrlProvider,
            IStaticSiteStorer storer,
            IImageCropNameGenerator imageCropNameGenerator,
            MediaFileManager mediaFileSystem,
            IWebHostEnvironment hostingEnvironment,
            IServer server)
        {
            _umbracoContextFactory = umbracoContextFactory;
            _publishedUrlProvider = publishedUrlProvider;
            _storer = storer;
            _imageCropNameGenerator = imageCropNameGenerator;
            _mediaFileSystem = mediaFileSystem;
            _hostingEnvironment = hostingEnvironment;
            _server = server;

            HttpClient = new HttpClient();

            BaseUri = new Uri(_server.Features.Get<IServerAddressesFeature>().Addresses.First());
        }

        public async Task<GenerateItemResult> GenerateApiResult(string requestPath, string storagePath, Dictionary<string, string> headers, int staticSiteId)
        {
            SslTruster.TrustSslIfAppSettingConfigured();

            try
            {
                var absoluteUrl = new Uri(BaseUri, requestPath);

                var fileData = await GetFileDataFromWebClient(absoluteUrl.AbsoluteUri);

                var generatedFileLocation = await Store(staticSiteId, storagePath, fileData);

                return GenerateItemResult.Success("API", requestPath, generatedFileLocation);
            }
            catch (Exception e)
            {
                return GenerateItemResult.Error("API", requestPath, e.Message);
            }
        }

        protected virtual async Task<string> GetFileDataFromWebClient(string absoluteUrl)
        {
            SslTruster.TrustSslIfAppSettingConfigured();

            try
            {
                if (absoluteUrl == null || absoluteUrl == "#") return null;

                string downloadedSource = await HttpClient.GetStringAsync(absoluteUrl);

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

                byte[] fileBytes = await HttpClient.GetByteArrayAsync(absoluteUrl);
                File.WriteAllBytes(filePath, fileBytes);

                return filePath;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("error while publishing to file " + ex.Message);
                //throw;
            }

            return null;
        }

        protected async Task<string> Store(int staticSiteId, string filePath, string fileData)
        {
            return await _storer.StoreSiteItem(staticSiteId.ToString(), filePath, fileData, DefaultEncoder);
        }
    }
}