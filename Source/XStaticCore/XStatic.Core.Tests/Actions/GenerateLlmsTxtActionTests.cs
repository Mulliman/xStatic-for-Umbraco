using Moq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using XStatic.Core.Actions;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Repositories;
using Xunit;

namespace XStatic.Core.Tests.Actions
{
    public sealed class GenerateLlmsTxtActionTests : IDisposable
    {
        private readonly string _tempRoot;
        private readonly string _siteDir;

        public GenerateLlmsTxtActionTests()
        {
            _tempRoot = Path.Combine(Path.GetTempPath(), "xstatic-llms-tests-" + Guid.NewGuid().ToString("N"));
            _siteDir = Path.Combine(_tempRoot, "42");
            Directory.CreateDirectory(_siteDir);
        }

        public void Dispose()
        {
            try { Directory.Delete(_tempRoot, recursive: true); } catch { /* best effort */ }
        }

        private Mock<IStaticSiteStorer> CreateFileBackedStorer(int siteId)
        {
            var storer = new Mock<IStaticSiteStorer>();
            storer.Setup(s => s.GetStorageLocationOfSite(siteId)).Returns(_siteDir);
            storer.Setup(s => s.StoreSiteItem(siteId.ToString(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Encoding>()))
                .Returns<string, string, string, Encoding>(async (_, path, contents, encoding) =>
                {
                    var fullPath = Path.Combine(_siteDir, path.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                    Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
                    await File.WriteAllTextAsync(fullPath, contents, encoding);
                    return fullPath;
                });
            return storer;
        }

        private void WriteSiteFile(string relativePath, string content)
        {
            var fullPath = Path.Combine(_siteDir, relativePath.Replace('/', Path.DirectorySeparatorChar));
            Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
            File.WriteAllText(fullPath, content, Encoding.UTF8);
        }

        [Fact]
        public async Task RunAction_GeneratesLlmsTxtAndLlmsFullTxt_WithGroupedSectionsAndMarkdownLinks()
        {
            WriteSiteFile("index.html", """
                <html>
                <head>
                    <title>Acme Static</title>
                    <meta name="description" content="Fast static sites built with Umbraco." />
                </head>
                <body><main><h1>Welcome to Acme</h1><p>Homepage body.</p></main></body>
                </html>
                """);
            WriteSiteFile("index.md", "# Welcome to Acme\n\nHomepage body.");

            WriteSiteFile("about/index.html", """
                <html>
                <head>
                    <title>About Us</title>
                    <meta name="description" content="Our mission." />
                </head>
                <body><main><h1>About Us</h1><p>We build static sites.</p></main></body>
                </html>
                """);
            WriteSiteFile("about/index.md", "# About Us\n\nWe build static sites.");

            WriteSiteFile("docs/getting-started/index.html", """
                <html>
                <head>
                    <title>Getting Started</title>
                    <meta name="description" content="Quickstart guide." />
                </head>
                <body><main><h1>Getting Started</h1><p>Install xStatic.</p></main></body>
                </html>
                """);

            WriteSiteFile("404/index.html", "<html><head><title>Not Found</title></head><body><h1>404</h1></body></html>");

            var sitesRepo = new Mock<ISitesRepository>();
            sitesRepo.Setup(r => r.Get<SiteConfig>(42)).Returns(new SiteConfig
            {
                Id = 42,
                Name = "Acme Docs",
                TargetHostname = "https://acme.example.com"
            });

            var storer = CreateFileBackedStorer(42);
            var action = new GenerateLlmsTxtAction(sitesRepo.Object, storer.Object);

            var result = await action.RunAction(42, new Dictionary<string, string>
            {
                [GenerateLlmsTxtFields.ExcludePaths] = "/404"
            });

            Assert.True(result.WasSuccessful);

            var llmsTxtPath = Path.Combine(_siteDir, "llms.txt");
            var llmsFullTxtPath = Path.Combine(_siteDir, "llms-full.txt");

            Assert.True(File.Exists(llmsTxtPath));
            Assert.True(File.Exists(llmsFullTxtPath));

            var llmsTxt = await File.ReadAllTextAsync(llmsTxtPath);
            Assert.Contains("# Acme Docs", llmsTxt);
            Assert.Contains("> Fast static sites built with Umbraco.", llmsTxt);
            Assert.Contains("## Pages", llmsTxt);
            Assert.Contains("- [Acme Static](https://acme.example.com/index.md): Fast static sites built with Umbraco.", llmsTxt);
            Assert.Contains("- [About Us](https://acme.example.com/about/index.md): Our mission.", llmsTxt);
            Assert.Contains("## Docs", llmsTxt);
            // No companion .md existed for docs/getting-started, so it links to the page URL
            Assert.Contains("- [Getting Started](https://acme.example.com/docs/getting-started/): Quickstart guide.", llmsTxt);
            Assert.DoesNotContain("Not Found", llmsTxt);

            var llmsFullTxt = await File.ReadAllTextAsync(llmsFullTxtPath);
            Assert.Contains("<!-- Source: https://acme.example.com/ -->", llmsFullTxt);
            Assert.Contains("Homepage body.", llmsFullTxt);
            Assert.Contains("We build static sites.", llmsFullTxt);
            Assert.Contains("Install xStatic.", llmsFullTxt);
            Assert.DoesNotContain("404", llmsFullTxt);
        }

        [Fact]
        public async Task RunAction_SkipsLlmsFullTxt_WhenGenerateFullFileIsFalse_AndGeneratesCompanionMdWhenEnabled()
        {
            WriteSiteFile("index.html", "<html><head><title>Home</title></head><body><main><h1>Home</h1><p>Hello</p></main></body></html>");

            var sitesRepo = new Mock<ISitesRepository>();
            sitesRepo.Setup(r => r.Get<SiteConfig>(42)).Returns(new SiteConfig
            {
                Id = 42,
                Name = "My Site"
            });

            var storer = CreateFileBackedStorer(42);
            var action = new GenerateLlmsTxtAction(sitesRepo.Object, storer.Object);

            var result = await action.RunAction(42, new Dictionary<string, string>
            {
                [GenerateLlmsTxtFields.SiteTitle] = "Custom Override Title",
                [GenerateLlmsTxtFields.SiteDescription] = "Custom summary.",
                [GenerateLlmsTxtFields.GenerateFullFile] = "false",
                [GenerateLlmsTxtFields.GenerateCompanionMarkdown] = "true"
            });

            Assert.True(result.WasSuccessful);
            Assert.True(File.Exists(Path.Combine(_siteDir, "llms.txt")));
            Assert.False(File.Exists(Path.Combine(_siteDir, "llms-full.txt")));
            Assert.True(File.Exists(Path.Combine(_siteDir, "index.md")));

            var llmsTxt = await File.ReadAllTextAsync(Path.Combine(_siteDir, "llms.txt"));
            Assert.Contains("# Custom Override Title", llmsTxt);
            Assert.Contains("> Custom summary.", llmsTxt);
            Assert.Contains("- [Home](/index.md)", llmsTxt);
        }

        [Fact]
        public async Task RunAction_ReturnsError_WhenSiteConfigMissing()
        {
            var sitesRepo = new Mock<ISitesRepository>();
            sitesRepo.Setup(r => r.Get<SiteConfig>(99)).Returns((SiteConfig)null!);

            var storer = CreateFileBackedStorer(99);
            var action = new GenerateLlmsTxtAction(sitesRepo.Object, storer.Object);

            var result = await action.RunAction(99, new Dictionary<string, string>());

            Assert.False(result.WasSuccessful);
            Assert.Contains("Site config not found", result.Message);
        }

        [Fact]
        public async Task GenerateCompanionMarkdownAction_CreatesMarkdownTwinsAndRespectsExclusions()
        {
            WriteSiteFile("index.html", "<html><head><title>Home</title></head><body><nav>Menu</nav><main><h1>Home</h1><p>Body</p></main></body></html>");
            WriteSiteFile("blog/post-1/index.html", "<html><head><title>Post 1</title></head><body><main><h1>Post 1</h1><p>Content</p></main></body></html>");
            WriteSiteFile("search/index.html", "<html><head><title>Search</title></head><body><main><h1>Search</h1></main></body></html>");

            var storer = CreateFileBackedStorer(42);
            var action = new GenerateCompanionMarkdownAction(storer.Object);

            var result = await action.RunAction(42, new Dictionary<string, string>
            {
                [GenerateCompanionMarkdownFields.ExcludePaths] = "/search"
            });

            Assert.True(result.WasSuccessful);
            Assert.True(File.Exists(Path.Combine(_siteDir, "index.md")));
            Assert.True(File.Exists(Path.Combine(_siteDir, "blog", "post-1", "index.md")));
            Assert.False(File.Exists(Path.Combine(_siteDir, "search", "index.md")));

            var homeMd = await File.ReadAllTextAsync(Path.Combine(_siteDir, "index.md"));
            Assert.Contains("# Home", homeMd);
            Assert.Contains("Body", homeMd);
            Assert.DoesNotContain("Menu", homeMd);
        }

        [Fact]
        public async Task RunAction_ScansHtmFiles_EscapesTitles_AndRebuildsStaleCompanionMarkdown()
        {
            WriteSiteFile("legacy.htm", "<html><head><title>Legacy [v1]</title></head><body><main><h1>Legacy [v1]</h1><p>Fresh HTML body</p></main></body></html>");
            var mdPath = Path.Combine(_siteDir, "legacy.md");
            File.WriteAllText(mdPath, "# Stale Markdown", Encoding.UTF8);
            File.SetLastWriteTimeUtc(mdPath, DateTime.UtcNow.AddHours(-2));
            File.SetLastWriteTimeUtc(Path.Combine(_siteDir, "legacy.htm"), DateTime.UtcNow);

            var sitesRepo = new Mock<ISitesRepository>();
            sitesRepo.Setup(r => r.Get<SiteConfig>(42)).Returns(new SiteConfig { Id = 42, Name = "Site" });

            var storer = CreateFileBackedStorer(42);
            var action = new GenerateLlmsTxtAction(sitesRepo.Object, storer.Object);

            var result = await action.RunAction(42, new Dictionary<string, string>
            {
                [GenerateLlmsTxtFields.GenerateCompanionMarkdown] = "true"
            });

            Assert.True(result.WasSuccessful);
            var llmsTxt = await File.ReadAllTextAsync(Path.Combine(_siteDir, "llms.txt"));
            Assert.Contains("- [Legacy \\[v1\\]](/legacy.md)", llmsTxt);

            var llmsFullTxt = await File.ReadAllTextAsync(Path.Combine(_siteDir, "llms-full.txt"));
            Assert.Contains("Fresh HTML body", llmsFullTxt);
            Assert.DoesNotContain("Stale Markdown", llmsFullTxt);
        }

        [Fact]
        public void GenerateLlmsTxtAction_EditableFields_UseStringCompatibleEditors()
        {
            var attrs = (XStaticEditableFieldAttribute[])Attribute.GetCustomAttributes(
                typeof(GenerateLlmsTxtAction), typeof(XStaticEditableFieldAttribute), inherit: false);

            Assert.NotEmpty(attrs);
            Assert.Contains(attrs, a => a.FieldName == GenerateLlmsTxtFields.GenerateFullFile && a.EditorUiAlias == UIEditors.Toggle);
        }

        [Fact]
        public async Task StaticHtmlWithMarkdownSiteGenerator_StoresHtmlAndMarkdown_AndPassesPageUrlToDiscoveryTransformer()
        {
            var storer = CreateFileBackedStorer(42);
            var generator = new TestableMarkdownSiteGenerator(
                storer.Object,
                htmlToReturn: "<html><head><title>About</title></head><body><nav>Nav</nav><main><h1>About</h1><p>Hello world</p></main></body></html>",
                relativeUrl: "/about/");

            var transformers = new XStatic.Core.Generator.Transformers.GeoHtmlTransformerListFactory()
                .BuildTransformers(new SiteConfig { TargetHostname = "https://example.com" });

            var result = await generator.GeneratePage(1, 42, new EverythingIsIndexHtmlFileNameGenerator(), transformers);

            Assert.True(result.WasSuccessful, result.Message);
            var html = await File.ReadAllTextAsync(Path.Combine(_siteDir, "about", "index.html"));
            var md = await File.ReadAllTextAsync(Path.Combine(_siteDir, "about", "index.md"));

            Assert.Contains("<link rel=\"alternate\" type=\"text/markdown\" href=\"https://example.com/about/index.md\" />", html);
            Assert.Contains("# About", md);
            Assert.Contains("Hello world", md);
            Assert.DoesNotContain("Nav", md);
        }

        [Fact]
        public async Task StaticHtmlWithMarkdownSiteGenerator_DoesNotFailHtmlPage_WhenMarkdownConversionThrows()
        {
            var storer = CreateFileBackedStorer(42);
            var failingConverter = new Mock<XStatic.Core.Generator.Markdown.IHtmlToMarkdownConverter>();
            failingConverter.Setup(c => c.Convert(It.IsAny<string>(), It.IsAny<XStatic.Core.Generator.Markdown.HtmlToMarkdownOptions>()))
                .Throws(new InvalidOperationException("Boom"));

            var generator = new TestableMarkdownSiteGenerator(
                storer.Object,
                htmlToReturn: "<html><head><title>About</title></head><body><main><h1>About</h1></main></body></html>",
                relativeUrl: "/about/",
                converter: failingConverter.Object);

            var result = await generator.GeneratePage(1, 42, new EverythingIsIndexHtmlFileNameGenerator());

            Assert.True(result.WasSuccessful, result.Message);
            Assert.True(File.Exists(Path.Combine(_siteDir, "about", "index.html")));
            Assert.False(File.Exists(Path.Combine(_siteDir, "about", "index.md")));
        }

        private sealed class TestableMarkdownSiteGenerator : XStatic.Core.Generator.StaticHtmlWithMarkdownSiteGenerator
        {
            private readonly string _htmlToReturn;
            private readonly string _relativeUrl;

            public TestableMarkdownSiteGenerator(
                IStaticSiteStorer storer,
                string htmlToReturn,
                string relativeUrl,
                XStatic.Core.Generator.Markdown.IHtmlToMarkdownConverter? converter = null)
                : base(
                    CreateContextFactory(relativeUrl),
                    CreateUrlProvider(relativeUrl),
                    storer,
                    Mock.Of<IImageCropNameGenerator>(),
                    null!,
                    Mock.Of<Microsoft.AspNetCore.Hosting.IWebHostEnvironment>(),
                    Microsoft.Extensions.Logging.Abstractions.NullLogger<XStatic.Core.Generator.StaticHtmlSiteGenerator>.Instance,
                    Microsoft.Extensions.Options.Options.Create(new XStatic.Core.App.XStaticGlobalSettings()),
                    converter)
            {
                _htmlToReturn = htmlToReturn;
                _relativeUrl = relativeUrl;
            }

            protected override Task<string> GetFileDataFromWebClient(string absoluteUrl) => Task.FromResult(_htmlToReturn);

            private static Umbraco.Cms.Core.Web.IUmbracoContextFactory CreateContextFactory(string relativeUrl)
            {
                var contentType = new Mock<Umbraco.Cms.Core.Models.PublishedContent.IPublishedContentType>();
                contentType.SetupGet(ct => ct.ItemType).Returns(Umbraco.Cms.Core.Models.PublishedContent.PublishedItemType.Content);

                var content = new Mock<Umbraco.Cms.Core.Models.PublishedContent.IPublishedContent>();
                content.SetupGet(c => c.Id).Returns(1);
                content.SetupGet(c => c.Key).Returns(Guid.NewGuid());
                content.SetupGet(c => c.TemplateId).Returns(10);
                content.SetupGet(c => c.ItemType).Returns(Umbraco.Cms.Core.Models.PublishedContent.PublishedItemType.Content);
                content.SetupGet(c => c.ContentType).Returns(contentType.Object);
                content.SetupGet(c => c.UrlSegment).Returns(relativeUrl.Trim('/'));

                var contentCache = new Mock<Umbraco.Cms.Core.PublishedCache.IPublishedContentCache>();
                contentCache.Setup(c => c.GetById(1)).Returns(content.Object);

                var domainCache = new Mock<Umbraco.Cms.Core.PublishedCache.IDomainCache>();
                domainCache.Setup(d => d.GetAll(false)).Returns(Array.Empty<Umbraco.Cms.Core.Routing.Domain>());

                var umbracoContext = new Mock<Umbraco.Cms.Core.Web.IUmbracoContext>();
                umbracoContext.SetupGet(c => c.Content).Returns(contentCache.Object);
                umbracoContext.SetupGet(c => c.Domains).Returns(domainCache.Object);

                var ctxRef = new Umbraco.Cms.Core.UmbracoContextReference(umbracoContext.Object, true, Mock.Of<Umbraco.Cms.Core.Web.IUmbracoContextAccessor>());
                var factory = new Mock<Umbraco.Cms.Core.Web.IUmbracoContextFactory>();
                factory.Setup(f => f.EnsureUmbracoContext()).Returns(ctxRef);
                return factory.Object;
            }

            private static Umbraco.Cms.Core.Routing.IPublishedUrlProvider CreateUrlProvider(string relativeUrl)
            {
                var provider = new Mock<Umbraco.Cms.Core.Routing.IPublishedUrlProvider>();
                provider.Setup(p => p.GetUrl(
                        It.IsAny<Umbraco.Cms.Core.Models.PublishedContent.IPublishedContent>(),
                        Umbraco.Cms.Core.Models.PublishedContent.UrlMode.Relative,
                        It.IsAny<string?>()))
                    .Returns(relativeUrl);
                provider.Setup(p => p.GetUrl(
                        It.IsAny<Umbraco.Cms.Core.Models.PublishedContent.IPublishedContent>(),
                        Umbraco.Cms.Core.Models.PublishedContent.UrlMode.Absolute,
                        It.IsAny<string?>()))
                    .Returns("https://localhost" + relativeUrl);
                provider.Setup(p => p.GetUrl(
                        It.IsAny<int>(),
                        Umbraco.Cms.Core.Models.PublishedContent.UrlMode.Relative,
                        It.IsAny<string?>(),
                        It.IsAny<Uri?>()))
                    .Returns(relativeUrl);
                provider.Setup(p => p.GetUrl(
                        It.IsAny<int>(),
                        Umbraco.Cms.Core.Models.PublishedContent.UrlMode.Absolute,
                        It.IsAny<string?>(),
                        It.IsAny<Uri?>()))
                    .Returns("https://localhost" + relativeUrl);
                provider.Setup(p => p.GetUrl(
                        It.IsAny<Guid>(),
                        Umbraco.Cms.Core.Models.PublishedContent.UrlMode.Relative,
                        It.IsAny<string?>(),
                        It.IsAny<Uri?>()))
                    .Returns(relativeUrl);
                provider.Setup(p => p.GetUrl(
                        It.IsAny<Guid>(),
                        Umbraco.Cms.Core.Models.PublishedContent.UrlMode.Absolute,
                        It.IsAny<string?>(),
                        It.IsAny<Uri?>()))
                    .Returns("https://localhost" + relativeUrl);
                return provider.Object;
            }
        }
    }
}
