using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Razor.Generator;
using Umbraco.Core;
using Umbraco.Core.Composing;
using Umbraco.Core.Models.PublishedContent;
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

        public async Task<string> Generate(int id, int staticSiteId, IFileNameGenerator fileNamer, IEnumerable<ITransformer> transformers = null)
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

        public Task<string> GenerateWithChildren(int id, int staticSiteId)
        {
            var node = GetNode(id);

            return null;
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

        private IPublishedContent GetNode(int id)
        {
            using (var umbracoContextReference = _umbracoContextFactory.EnsureUmbracoContext())
            {
                var content = umbracoContextReference.UmbracoContext.Content;
                return content.GetById(id);
            }
        }
    }
}
