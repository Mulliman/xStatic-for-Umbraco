using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Web;
using XStatic.Core.Actions;
using XStatic.Core.App;
using XStatic.Core.AutoPublish;
using XStatic.Core.Deploy;
using XStatic.Core.Deploy.Targets;
using XStatic.Core.Deploy.Targets.Db;
using XStatic.Core.Generator;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.ExportTypes;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;
using XStatic.Core.Models;
using XStatic.Core.Repositories;
using Xunit;

namespace XStatic.Core.Tests.AutoPublish
{
    public sealed class DefaultAutoPublisherTests : IDisposable
    {
        private const int WorkingFormat = 1;
        private const int BrokenFormat = 2;
        private const int TargetId = 7;

        private readonly string _root = Path.Combine(Path.GetTempPath(), "xstatic-autopublish-" + Guid.NewGuid().ToString("N"));
        private readonly Mock<ISitesRepository> _sites = new();
        private readonly Mock<IExportTypeService> _exportTypes = new();
        private readonly Mock<IStaticSiteStorer> _storer = new();
        private readonly Mock<IDeploymentTargetRepository> _targets = new();
        private readonly Mock<IDeployerService> _deployers = new();
        private readonly Mock<IDeployer> _deployer = new();
        private readonly Mock<IAutoPublishSiteResolver> _resolver = new();
        private readonly CapturingLogger _logger = new();
        private readonly List<ExtendedGeneratedSite> _autoPublishSites = new();

        public DefaultAutoPublisherTests()
        {
            Directory.CreateDirectory(Path.Combine(_root, "wwwroot"));
            Directory.CreateDirectory(Path.Combine(_root, "output"));

            var transformerFactory = new Mock<ITransformerListFactory>();
            transformerFactory.Setup(f => f.BuildTransformers(It.IsAny<ISiteConfig>())).Returns(Array.Empty<ITransformer>());
            _exportTypes.Setup(e => e.GetFileNameGenerator(WorkingFormat)).Returns(Mock.Of<IFileNameGenerator>());
            _exportTypes.Setup(e => e.GetGenerator(WorkingFormat)).Returns(Mock.Of<IGenerator>());
            _exportTypes.Setup(e => e.GetTransformerListFactory(WorkingFormat)).Returns(transformerFactory.Object);
            _exportTypes.Setup(e => e.GetFileNameGenerator(BrokenFormat)).Throws(new InvalidOperationException("export type broken"));

            _storer.Setup(s => s.GetStorageLocationOfSite(It.IsAny<int>())).Returns(Path.Combine(_root, "output"));
            var config = new Dictionary<string, string>();
            _targets.Setup(t => t.Get(TargetId)).Returns(new DeploymentTargetDataModel { Id = TargetId, DeployerDefinition = "test", Config = config });
            _deployers.Setup(d => d.GetDeployer("test", It.IsAny<Dictionary<string, string>>())).Returns(_deployer.Object);
            _deployer.Setup(d => d.DeployWholeSite(It.IsAny<string>())).ReturnsAsync(XStaticResult.Success());

            _sites.Setup(s => s.GetAutoPublishSites()).Returns(_autoPublishSites);
            _resolver.Setup(r => r.ResolveAffectedSites(
                    It.IsAny<IEnumerable<IContent>>(),
                    It.IsAny<IReadOnlyCollection<ExtendedGeneratedSite>>(),
                    It.IsAny<IReadOnlyDictionary<int, IPublishedContent>>()))
                .Returns(() => _autoPublishSites);
        }

        public void Dispose()
        {
            try { Directory.Delete(_root, recursive: true); } catch { /* best effort */ }
        }

        private void GivenSite(int id, int? deploymentTarget = TargetId, int exportFormat = WorkingFormat, bool registered = true)
        {
            _autoPublishSites.Add(new ExtendedGeneratedSite { Id = id, Name = "Site " + id, DeploymentTarget = deploymentTarget, ExportFormat = exportFormat, RootNode = Guid.NewGuid() });

            if (registered)
            {
                _sites.Setup(s => s.Get<SiteConfig>(id)).Returns(new SiteConfig { Id = id, Name = "Site " + id, DeploymentTarget = deploymentTarget, ExportFormat = exportFormat, RootNode = Guid.NewGuid() });
            }
        }

        private DefaultAutoPublisher NewPublisher()
        {
            var umbracoContext = new Mock<IUmbracoContext>();
            umbracoContext.Setup(c => c.Content).Returns(Mock.Of<IPublishedContentCache>());
            umbracoContext.Setup(c => c.Media).Returns(Mock.Of<IPublishedMediaCache>());
            var contextFactory = new Mock<IUmbracoContextFactory>();
            contextFactory.Setup(f => f.EnsureUmbracoContext())
                .Returns(() => new UmbracoContextReference(umbracoContext.Object, false, Mock.Of<IUmbracoContextAccessor>()));

            var environment = Mock.Of<IWebHostEnvironment>(e => e.ContentRootPath == _root && e.WebRootPath == Path.Combine(_root, "wwwroot"));

            return new DefaultAutoPublisher(_sites.Object, contextFactory.Object, _deployers.Object, _targets.Object, _storer.Object,
                _exportTypes.Object, environment, Mock.Of<IActionFactory>(), Options.Create(new XStaticGlobalSettings()), _logger,
                new[] { _resolver.Object });
        }

        private static IContent[] Published() => new[] { Mock.Of<IContent>(c => c.Id == 1001 && c.Path == "-1,1001") };

        [Fact]
        public async Task RunAutoPublish_SkipsSitesWithoutDeploymentTarget()
        {
            GivenSite(1, deploymentTarget: null);

            await NewPublisher().RunAutoPublish(Published());

            _sites.Verify(s => s.Get<SiteConfig>(1), Times.Never);
            _deployer.Verify(d => d.DeployWholeSite(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task RunAutoPublish_SuccessfulRebuild_Deploys()
        {
            GivenSite(1);

            await NewPublisher().RunAutoPublish(Published());

            _deployer.Verify(d => d.DeployWholeSite(It.IsAny<string>()), Times.Once);
            Assert.DoesNotContain(_logger.Entries, e => e.Level == LogLevel.Error);
        }

        [Fact]
        public async Task RunAutoPublish_CatastrophicRebuildFailure_SkipsDeploy()
        {
            GivenSite(1, exportFormat: BrokenFormat);

            await NewPublisher().RunAutoPublish(Published());

            _deployer.Verify(d => d.DeployWholeSite(It.IsAny<string>()), Times.Never);
            Assert.Contains(_logger.Entries, e => e.Level == LogLevel.Error && e.Message.Contains("wasn't deployed") && e.Message.Contains("export type broken"));
        }

        [Fact]
        public async Task RunAutoPublish_OneSiteThrowing_DoesNotStopTheOthers()
        {
            GivenSite(1, registered: false); // RebuildSite throws XStaticException: site not found.
            GivenSite(2);

            var exception = await Record.ExceptionAsync(() => NewPublisher().RunAutoPublish(Published()));

            Assert.Null(exception);
            _sites.Verify(s => s.Get<SiteConfig>(2), Times.AtLeastOnce);
            _deployer.Verify(d => d.DeployWholeSite(It.IsAny<string>()), Times.Once);
            Assert.Contains(_logger.Entries, e => e.Level == LogLevel.Error && e.Exception is XStaticException);
        }

        [Fact]
        public async Task RunAutoPublish_DeployerThrows_IsLoggedAndNotRethrown()
        {
            GivenSite(1);
            _deployer.Setup(d => d.DeployWholeSite(It.IsAny<string>())).ThrowsAsync(new IOException("network down"));

            var exception = await Record.ExceptionAsync(() => NewPublisher().RunAutoPublish(Published()));

            Assert.Null(exception);
            Assert.Contains(_logger.Entries, e => e.Level == LogLevel.Error && e.Exception is IOException);
        }

        [Fact]
        public async Task RunAutoPublish_FailedDeploy_LogsErrorWithoutThrowing()
        {
            GivenSite(1);
            _deployer.Setup(d => d.DeployWholeSite(It.IsAny<string>())).ReturnsAsync(XStaticResult.Error("upload rejected"));

            var exception = await Record.ExceptionAsync(() => NewPublisher().RunAutoPublish(Published()));

            Assert.Null(exception);
            Assert.Contains(_logger.Entries, e => e.Level == LogLevel.Error && e.Message.Contains("upload rejected"));
            _sites.Verify(s => s.UpdateLastDeploy(It.IsAny<int>(), It.IsAny<int?>()), Times.Never);
        }

        private sealed class CapturingLogger : ILogger<DefaultAutoPublisher>
        {
            public List<(LogLevel Level, string Message, Exception? Exception)> Entries { get; } = new();

            public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

            public bool IsEnabled(LogLevel logLevel) => true;

            public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
            {
                Entries.Add((logLevel, formatter(state, exception), exception));
            }
        }
    }
}
