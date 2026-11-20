using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Web;
using XStatic.Core.App;
using XStatic.Core.Generator;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;
using Xunit;

namespace XStatic.Core.Tests.Generator
{
    public class StaticHtmlSiteGeneratorTests
    {
        private const int SiteId = 5;
        private const int PageId = 1001;

        /// <summary>Replaces the HTTP download with a canned response, so no server is needed.</summary>
        private sealed class TestGenerator : StaticHtmlSiteGenerator
        {
            public TestGenerator(IUmbracoContextFactory contextFactory, IPublishedUrlProvider urlProvider, IStaticSiteStorer storer)
                : base(contextFactory, urlProvider, storer, new ImageCropNameGenerator(), null!, Mock.Of<IWebHostEnvironment>(),
                    NullLogger<StaticHtmlSiteGenerator>.Instance, Options.Create(new XStaticGlobalSettings()))
            {
            }

            public Dictionary<string, string?> Responses { get; } = new();

            public List<string> RequestedUrls { get; } = new();

            protected override Task<string> GetFileDataFromWebClient(string absoluteUrl)
            {
                RequestedUrls.Add(absoluteUrl);
                return Task.FromResult(Responses.TryGetValue(absoluteUrl, out var html) ? html! : null!);
            }
        }

        private readonly Mock<IPublishedContentCache> _content = new();
        private readonly Mock<IPublishedUrlProvider> _urls = new();
        private readonly Mock<IStaticSiteStorer> _storer = new();
        private readonly Mock<IPublishedContent> _page = new();

        public StaticHtmlSiteGeneratorTests()
        {
            _page.Setup(p => p.Id).Returns(PageId);
            _page.Setup(p => p.TemplateId).Returns(1);
            _page.Setup(p => p.ItemType).Returns(PublishedItemType.Content);
            _page.Setup(p => p.ContentType).Returns(Mock.Of<IPublishedContentType>(t => t.ItemType == PublishedItemType.Content && t.Alias == "page"));
#pragma warning disable CS0618 // The generator still reports UrlSegment; see AGENTS.md known issues.
            _page.Setup(p => p.UrlSegment).Returns("about");
#pragma warning restore CS0618
            _content.Setup(c => c.GetById(PageId)).Returns(_page.Object);
            _urls.Setup(u => u.GetUrl(_page.Object, UrlMode.Relative, It.IsAny<string>(), It.IsAny<Uri>())).Returns("/about/");
            _urls.Setup(u => u.GetUrl(_page.Object, UrlMode.Absolute, It.IsAny<string>(), It.IsAny<Uri>())).Returns("https://cms.example.com/about/");
            _storer.Setup(s => s.StoreSiteItem(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Encoding>()))
                .ReturnsAsync((string site, string path, string _, Encoding _) => $"/output/{site}/{path}");
        }

        private TestGenerator NewGenerator()
        {
            var context = new Mock<IUmbracoContext>();
            context.Setup(c => c.Content).Returns(_content.Object);
            var factory = new Mock<IUmbracoContextFactory>();
            factory.Setup(f => f.EnsureUmbracoContext())
                .Returns(() => new UmbracoContextReference(context.Object, false, Mock.Of<IUmbracoContextAccessor>()));

            return new TestGenerator(factory.Object, _urls.Object, _storer.Object);
        }

        [Fact]
        public async Task GeneratePage_DownloadsTransformsAndStoresPage()
        {
            var generator = NewGenerator();
            generator.Responses["https://cms.example.com/about/"] = "<body>About</body>";
            var transformer = new Mock<ITransformer>();
            transformer.Setup(t => t.Transform("<body>About</body>", It.IsAny<IUmbracoContext>())).Returns("<body>ABOUT</body>");

            var result = await generator.GeneratePage(PageId, SiteId, new EverythingIsIndexHtmlFileNameGenerator(), new[] { transformer.Object });

            Assert.True(result.WasSuccessful, result.Message);
            Assert.Equal("Page", result.Type);
            Assert.Equal("about", result.Item);
            Assert.Equal(new[] { "https://cms.example.com/about/" }, generator.RequestedUrls);
            _storer.Verify(s => s.StoreSiteItem("5", "about/index.html", "<body>ABOUT</body>", Encoding.UTF8), Times.Once);
        }

        [Fact]
        public async Task GeneratePage_PassesCultureToUrlProvider()
        {
            _urls.Setup(u => u.GetUrl(_page.Object, UrlMode.Absolute, "da-DK", It.IsAny<Uri>())).Returns("https://cms.example.com/da/om/");
            _urls.Setup(u => u.GetUrl(_page.Object, UrlMode.Relative, "da-DK", It.IsAny<Uri>())).Returns("/da/om/");
            var generator = NewGenerator();
            generator.Responses["https://cms.example.com/da/om/"] = "<body>Om</body>";

            var result = await generator.GeneratePage(PageId, SiteId, new EverythingIsIndexHtmlFileNameGenerator(), culture: "da-DK");

            Assert.True(result.WasSuccessful, result.Message);
            _storer.Verify(s => s.StoreSiteItem("5", "da/om/index.html", "<body>Om</body>", Encoding.UTF8), Times.Once);
        }

        [Fact]
        public async Task GeneratePage_MissingNodeOrNoTemplate_ReturnsNull()
        {
            var generator = NewGenerator();

            Assert.Null(await generator.GeneratePage(9999, SiteId, new EverythingIsIndexHtmlFileNameGenerator()));

            _page.Setup(p => p.TemplateId).Returns((int?)null);
            Assert.Null(await generator.GeneratePage(PageId, SiteId, new EverythingIsIndexHtmlFileNameGenerator()));
            Assert.Empty(generator.RequestedUrls);
        }

        [Fact]
        public async Task GeneratePage_DownloadFails_ReportsErrorAndStoresNothing()
        {
            var generator = NewGenerator();

            var result = await generator.GeneratePage(PageId, SiteId, new EverythingIsIndexHtmlFileNameGenerator());

            Assert.False(result.WasSuccessful);
            Assert.Equal("about", result.Item);
            Assert.Contains("https://cms.example.com/about/", result.Message);
            _storer.Verify(s => s.StoreSiteItem(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Encoding>()), Times.Never);
        }

        [Fact]
        public async Task GeneratePage_StorerFails_ReportsError()
        {
            var generator = NewGenerator();
            generator.Responses["https://cms.example.com/about/"] = "<body></body>";
            _storer.Setup(s => s.StoreSiteItem(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Encoding>()))
                .ThrowsAsync(new IOException("disk full"));

            var result = await generator.GeneratePage(PageId, SiteId, new EverythingIsIndexHtmlFileNameGenerator());

            Assert.False(result.WasSuccessful);
            Assert.Equal("disk full", result.Message);
        }

        [Fact]
        public async Task GenerateFile_CopiesThroughStorer()
        {
            _storer.Setup(s => s.CopyFile("5", @"C:\site\robots.txt", "/robots.txt")).ReturnsAsync("/output/5/robots.txt");

            var result = await NewGenerator().GenerateFile(@"C:\site\robots.txt", "/robots.txt", SiteId);

            Assert.True(result.WasSuccessful);
            Assert.Equal("/robots.txt", result.Item);
            Assert.Equal("/output/5/robots.txt", result.Message);
        }

        [Fact]
        public async Task GenerateFile_CopyFails_ReportsError()
        {
            _storer.Setup(s => s.CopyFile(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())).ThrowsAsync(new FileNotFoundException("gone"));

            var result = await NewGenerator().GenerateFile(@"C:\site\missing.txt", "/missing.txt", SiteId);

            Assert.False(result.WasSuccessful);
            Assert.Equal("gone", result.Message);
        }

        [Fact]
        public async Task GenerateFolder_CopiesEachFileAndReportsFailuresIndividually()
        {
            var folder = Path.Combine(Path.GetTempPath(), "xstatic-tests-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(folder);
            try
            {
                File.WriteAllText(Path.Combine(folder, "a.css"), "a");
                File.WriteAllText(Path.Combine(folder, "b.css"), "b");
                _storer.Setup(s => s.CopyFile("5", It.Is<string>(p => p.EndsWith("a.css")), It.IsAny<string>())).ReturnsAsync("ok");
                _storer.Setup(s => s.CopyFile("5", It.Is<string>(p => p.EndsWith("b.css")), It.IsAny<string>())).ThrowsAsync(new IOException("locked"));

                var results = (await NewGenerator().GenerateFolder(folder, "/css", SiteId)).OrderBy(r => r.Item).ToList();

                Assert.Equal(2, results.Count);
                Assert.True(results[0].WasSuccessful);
                Assert.Equal(Path.Combine("/css", "a.css"), results[0].Item);
                Assert.False(results[1].WasSuccessful);
                Assert.Equal("locked", results[1].Message);
            }
            finally
            {
                Directory.Delete(folder, recursive: true);
            }
        }
    }
}
