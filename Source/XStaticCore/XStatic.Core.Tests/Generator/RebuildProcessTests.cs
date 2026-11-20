using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Web;
using XStatic.Core.Actions;
using XStatic.Core.App;
using XStatic.Core.Generator;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.ExportTypes;
using XStatic.Core.Generator.Processes;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;
using XStatic.Core.Repositories;
using Xunit;

namespace XStatic.Core.Tests.Generator
{
    public sealed class RebuildProcessTests : IDisposable
    {
        private const int SiteId = 3;
        private const int ExportFormat = 1;

        private readonly string _contentRoot = Path.Combine(Path.GetTempPath(), "xstatic-tests-" + Guid.NewGuid().ToString("N"));
        private readonly Mock<ISitesRepository> _sites = new();
        private readonly Mock<IExportTypeService> _exportTypes = new();
        private readonly Mock<IActionFactory> _actions = new();
        private readonly Mock<IGenerator> _generator = new();
        private readonly Mock<ITransformerListFactory> _transformerFactory = new();
        private readonly Mock<IPublishedContentCache> _content = new();
        private readonly Mock<IPublishedMediaCache> _media = new();
        private readonly IFileNameGenerator _fileNamer = Mock.Of<IFileNameGenerator>();

        public RebuildProcessTests()
        {
            Directory.CreateDirectory(Path.Combine(_contentRoot, "wwwroot"));

            _exportTypes.Setup(e => e.GetFileNameGenerator(ExportFormat)).Returns(_fileNamer);
            _exportTypes.Setup(e => e.GetGenerator(ExportFormat)).Returns(_generator.Object);
            _exportTypes.Setup(e => e.GetTransformerListFactory(ExportFormat)).Returns(_transformerFactory.Object);
            _transformerFactory.Setup(f => f.BuildTransformers(It.IsAny<ISiteConfig>())).Returns(Array.Empty<ITransformer>());
        }

        public void Dispose()
        {
            try { Directory.Delete(_contentRoot, recursive: true); } catch { /* best effort */ }
        }

        private SiteConfig GivenSite(Action<SiteConfig>? configure = null)
        {
            var site = new SiteConfig { Id = SiteId, Name = "Test", ExportFormat = ExportFormat, RootNode = Guid.NewGuid() };
            configure?.Invoke(site);
            _sites.Setup(s => s.Get<SiteConfig>(SiteId)).Returns(site);
            return site;
        }

        private string GivenAssetFile(string relativePath)
        {
            var path = Path.Combine(_contentRoot, "wwwroot", relativePath);
            Directory.CreateDirectory(Path.GetDirectoryName(path)!);
            File.WriteAllText(path, "asset");
            return path;
        }

        private RebuildProcess NewProcess(XStaticGlobalSettings? settings = null)
        {
            var umbracoContext = new Mock<IUmbracoContext>();
            umbracoContext.Setup(c => c.Content).Returns(_content.Object);
            umbracoContext.Setup(c => c.Media).Returns(_media.Object);

            var contextFactory = new Mock<IUmbracoContextFactory>();
            contextFactory.Setup(f => f.EnsureUmbracoContext())
                .Returns(new UmbracoContextReference(umbracoContext.Object, false, Mock.Of<IUmbracoContextAccessor>()));

            var environment = Mock.Of<IWebHostEnvironment>(e =>
                e.ContentRootPath == _contentRoot && e.WebRootPath == Path.Combine(_contentRoot, "wwwroot"));

            return new RebuildProcess(contextFactory.Object, _exportTypes.Object, _sites.Object, environment, _actions.Object,
                Options.Create(settings ?? new XStaticGlobalSettings()), NullLogger.Instance);
        }

        [Fact]
        public async Task RebuildSite_UnknownSite_Throws()
        {
            await Assert.ThrowsAsync<XStaticException>(() => NewProcess().RebuildSite(SiteId));
        }

        [Fact]
        public async Task RebuildSite_GeneratesAssetFilesAndRecordsRun()
        {
            var asset = GivenAssetFile("robots.txt");
            GivenSite(s => s.AssetPaths = "/robots.txt");
            _generator.Setup(g => g.GenerateFile(It.IsAny<string>(), It.IsAny<string>(), SiteId))
                .ReturnsAsync(GenerateItemResult.Success("File", "robots.txt"));

            var result = await NewProcess().RebuildSite(SiteId);

            Assert.True(result.WasSuccessful, result.Exception);
            Assert.Equal(SiteId, result.SiteId);
            Assert.Single(result.Results);
            Assert.Empty(result.Warnings);
            _generator.Verify(g => g.GenerateFile(It.Is<string>(p => Path.GetFullPath(p) == Path.GetFullPath(asset)), It.IsAny<string>(), SiteId));
            _sites.Verify(s => s.UpdateLastRun(SiteId, It.IsAny<int>()), Times.Once);
        }

        [Fact]
        public async Task RebuildSite_MissingRootNode_GeneratesNoPages()
        {
            GivenSite();

            var result = await NewProcess().RebuildSite(SiteId);

            Assert.True(result.WasSuccessful, result.Exception);
            Assert.Empty(result.Results);
            _generator.Verify(g => g.GeneratePage(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<IFileNameGenerator>(),
                It.IsAny<IEnumerable<ITransformer>>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task RebuildSite_FailedItem_MakesRunUnsuccessfulAndIsAWarning()
        {
            GivenAssetFile("robots.txt");
            GivenSite(s => s.AssetPaths = "/robots.txt");
            var failure = GenerateItemResult.Error("File", "robots.txt", "locked");
            _generator.Setup(g => g.GenerateFile(It.IsAny<string>(), It.IsAny<string>(), SiteId)).ReturnsAsync(failure);

            var result = await NewProcess().RebuildSite(SiteId);

            Assert.False(result.WasSuccessful);
            Assert.Same(failure, Assert.Single(result.Warnings));
        }

        [Fact]
        public async Task RebuildSite_MissingAssetPath_IsReportedButRunContinues()
        {
            GivenAssetFile("robots.txt");
            GivenSite(s => s.AssetPaths = "/robots.txt,/does-not-exist.txt");
            _generator.Setup(g => g.GenerateFile(It.IsAny<string>(), It.IsAny<string>(), SiteId))
                .ReturnsAsync(GenerateItemResult.Success("File", "robots.txt"));

            var result = await NewProcess().RebuildSite(SiteId);

            Assert.False(result.WasSuccessful);
            Assert.Equal(2, result.Results.Count);
            Assert.Contains(result.Warnings, w => w.Item.Contains("does-not-exist"));
        }

        [Fact]
        public async Task RebuildSite_UnsupportedExportFormat_ReturnsFailureWithMessage()
        {
            GivenSite();
            _exportTypes.Setup(e => e.GetGenerator(ExportFormat)).Returns((IGenerator)null!);

            var result = await NewProcess().RebuildSite(SiteId);

            Assert.False(result.WasSuccessful);
            Assert.Equal("Export format not supported", result.Exception);
            _sites.Verify(s => s.UpdateLastRun(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        }

        [Fact]
        public async Task RebuildSite_PassesSiteToTransformerFactory()
        {
            var site = GivenSite();

            await NewProcess().RebuildSite(SiteId);

            _transformerFactory.Verify(f => f.BuildTransformers(site), Times.Once);
        }

        [Fact]
        public async Task RebuildSite_LooksUpEachValidMediaRoot()
        {
            var mediaA = Guid.NewGuid();
            var mediaB = Guid.NewGuid();
            GivenSite(s => s.MediaRootNodes = $"{mediaA},not-a-guid,{mediaB}");

            var result = await NewProcess().RebuildSite(SiteId);

            Assert.True(result.WasSuccessful, result.Exception);
            _media.Verify(m => m.GetById(mediaA), Times.Once);
            _media.Verify(m => m.GetById(mediaB), Times.Once);
        }

        [Fact]
        public async Task RebuildSite_RunsPostActionsWithTheirConfig()
        {
            var config = new Dictionary<string, string> { ["FilePath"] = "a" };
            var action = new Mock<IPostGenerationAction>();
            action.Setup(a => a.Name).Returns("Copy");
            action.Setup(a => a.RunAction(SiteId, config)).ReturnsAsync(XStaticResult.Success());
            GivenSite(s => s.PostGenerationActionIds = new List<int> { 10 });
            _actions.Setup(a => a.CreateConfiguredPostGenerationActions(10))
                .Returns(new[] { new ConfiguredPostGenerationAction(action.Object, config) });

            var result = await NewProcess().RebuildSite(SiteId);

            action.Verify(a => a.RunAction(SiteId, config), Times.Once);
            var actionResult = Assert.Single(result.Results);
            Assert.True(actionResult.WasSuccessful);
            Assert.Equal("PostAction", actionResult.Type);
            Assert.Equal("Copy", actionResult.Item);
        }

        [Fact]
        public async Task RebuildSite_PostActionThatThrows_IsReportedAsError()
        {
            var action = new Mock<IPostGenerationAction>();
            action.Setup(a => a.Name).Returns("Broken");
            action.Setup(a => a.RunAction(It.IsAny<int>(), It.IsAny<Dictionary<string, string>>())).ThrowsAsync(new InvalidOperationException("boom"));
            GivenSite(s => s.PostGenerationActionIds = new List<int> { 10 });
            _actions.Setup(a => a.CreateConfiguredPostGenerationActions(10))
                .Returns(new[] { new ConfiguredPostGenerationAction(action.Object, new()) });

            var result = await NewProcess().RebuildSite(SiteId);

            Assert.False(result.WasSuccessful);
            var warning = Assert.Single(result.Warnings);
            Assert.Equal("Broken", warning.Item);
            Assert.Equal("boom", warning.Message);
        }

        [Fact]
        public async Task RebuildSite_PostActionReturningError_IsReportedAndLaterActionsStillRun()
        {
            var failing = new Mock<IPostGenerationAction>();
            failing.Setup(a => a.Name).Returns("Copy404");
            failing.Setup(a => a.RunAction(SiteId, It.IsAny<Dictionary<string, string>>()))
                .ReturnsAsync(XStaticResult.Error("Error running file copy action", new IOException("file missing")));
            var later = new Mock<IPostGenerationAction>();
            later.Setup(a => a.Name).Returns("Metadata");
            later.Setup(a => a.RunAction(SiteId, It.IsAny<Dictionary<string, string>>())).ReturnsAsync(XStaticResult.Success());
            GivenSite(s => s.PostGenerationActionIds = new List<int> { 10, 11 });
            _actions.Setup(a => a.CreateConfiguredPostGenerationActions(10, 11)).Returns(new[]
            {
                new ConfiguredPostGenerationAction(failing.Object, new()),
                new ConfiguredPostGenerationAction(later.Object, new()),
            });

            var result = await NewProcess().RebuildSite(SiteId);

            Assert.False(result.WasSuccessful);
            var warning = Assert.Single(result.Warnings);
            Assert.Equal("Copy404", warning.Item);
            Assert.Equal("Error running file copy action file missing", warning.Message);
            later.Verify(a => a.RunAction(SiteId, It.IsAny<Dictionary<string, string>>()), Times.Once);
            Assert.Contains(result.Results, r => r.Item == "Metadata" && r.WasSuccessful);
        }

        [Fact]
        public async Task RebuildSite_PostActionReturningNull_IsReportedAsError()
        {
            var action = new Mock<IPostGenerationAction>();
            action.Setup(a => a.Name).Returns("Custom");
            action.Setup(a => a.RunAction(It.IsAny<int>(), It.IsAny<Dictionary<string, string>>())).ReturnsAsync((XStaticResult)null!);
            GivenSite(s => s.PostGenerationActionIds = new List<int> { 10 });
            _actions.Setup(a => a.CreateConfiguredPostGenerationActions(10))
                .Returns(new[] { new ConfiguredPostGenerationAction(action.Object, new()) });

            var result = await NewProcess().RebuildSite(SiteId);

            Assert.False(result.WasSuccessful);
            Assert.Equal("Action returned no result.", Assert.Single(result.Warnings).Message);
        }

        [Fact]
        public async Task RebuildSite_NoPostActions_DoesNotCallFactory()
        {
            GivenSite(s => s.PostGenerationActionIds = new List<int>());

            await NewProcess().RebuildSite(SiteId);

            _actions.Verify(a => a.CreateConfiguredPostGenerationActions(It.IsAny<int[]>()), Times.Never);
        }
    }
}
