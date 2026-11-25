using System;
using System.Collections.Generic;
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
using Xunit;

namespace XStatic.Core.Tests.Generator
{
    public class StaticHtmlWithMarkdownSiteGeneratorTests
    {
        private const int SiteId = 5;
        private const int PageId = 1001;

        /// <summary>Replaces the HTTP download with a canned response, so no server is needed.</summary>
        private sealed class TestGenerator : StaticHtmlWithMarkdownSiteGenerator
        {
            public TestGenerator(IUmbracoContextFactory contextFactory, IPublishedUrlProvider urlProvider, IStaticSiteStorer storer)
                : base(contextFactory, urlProvider, storer, new ImageCropNameGenerator(), null!, Mock.Of<IWebHostEnvironment>(),
                    NullLogger<StaticHtmlSiteGenerator>.Instance, Options.Create(new XStaticGlobalSettings()))
            {
            }

            public Dictionary<string, string?> Responses { get; } = new();

            protected override Task<string> GetFileDataFromWebClient(string absoluteUrl)
            {
                return Task.FromResult(Responses.TryGetValue(absoluteUrl, out var html) ? html! : null!);
            }
        }

        private readonly Mock<IPublishedContentCache> _content = new();
        private readonly Mock<IPublishedUrlProvider> _urls = new();
        private readonly Mock<IStaticSiteStorer> _storer = new();
        private readonly Mock<IPublishedContent> _page = new();

        public StaticHtmlWithMarkdownSiteGeneratorTests()
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
        public async Task GeneratePage_StoresHtmlAndCompanionMarkdown()
        {
            var generator = NewGenerator();
            generator.Responses["https://cms.example.com/about/"] = "<html><body><h1>About</h1></body></html>";

            var result = await generator.GeneratePage(PageId, SiteId, new EverythingIsIndexHtmlFileNameGenerator());

            Assert.True(result.WasSuccessful, result.Message);
            Assert.Equal("about", result.Item);
            _storer.Verify(s => s.StoreSiteItem("5", "about/index.html", It.IsAny<string>(), It.IsAny<Encoding>()), Times.Once);
            _storer.Verify(s => s.StoreSiteItem("5", It.Is<string>(p => p.EndsWith(".md")), It.IsAny<string>(), It.IsAny<Encoding>()), Times.Once);
        }

        [Fact]
        public async Task GeneratePage_DownloadFails_ReportsErrorAndStoresNothing()
        {
            var generator = NewGenerator();

            var result = await generator.GeneratePage(PageId, SiteId, new EverythingIsIndexHtmlFileNameGenerator());

            Assert.False(result.WasSuccessful);
            Assert.Equal("Page", result.Type);
            Assert.Equal("about", result.Item);
            Assert.Contains("https://cms.example.com/about/", result.Message);
            _storer.Verify(s => s.StoreSiteItem(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Encoding>()), Times.Never);
        }
    }
}
