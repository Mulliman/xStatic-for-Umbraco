using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Moq;
using XStatic.Core.Deploy;
using XStatic.Core.Deploy.Processes;
using XStatic.Core.Deploy.Targets;
using XStatic.Core.Deploy.Targets.Db;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Repositories;
using Xunit;

namespace XStatic.Core.Tests.Deploy
{
    public class DeployProcessTests : IDisposable
    {
        private const int SiteId = 42;
        private const int TargetId = 7;

        private readonly string _outputFolder = Path.Combine(Path.GetTempPath(), "xstatic-deploy-" + Guid.NewGuid().ToString("N"));
        private readonly Mock<IStaticSiteStorer> _storer = new();
        private readonly Mock<ISitesRepository> _sites = new();
        private readonly Mock<IDeploymentTargetRepository> _targets = new();
        private readonly Mock<IDeployerService> _deployers = new();
        private readonly Mock<IDeployer> _deployer = new();

        public DeployProcessTests()
        {
            Directory.CreateDirectory(_outputFolder);
            _storer.Setup(s => s.GetStorageLocationOfSite(SiteId)).Returns(_outputFolder);
            _sites.Setup(s => s.Get<SiteConfig>(SiteId)).Returns(new SiteConfig { Id = SiteId, DeploymentTarget = TargetId });
            var config = new Dictionary<string, string> { ["key"] = "value" };
            _targets.Setup(t => t.Get(TargetId)).Returns(new DeploymentTargetDataModel { Id = TargetId, DeployerDefinition = "test", Config = config });
            _deployers.Setup(d => d.GetDeployer("test", config)).Returns(_deployer.Object);
        }

        public void Dispose()
        {
            if (Directory.Exists(_outputFolder))
            {
                Directory.Delete(_outputFolder, recursive: true);
            }
        }

        private DeployProcess NewProcess() => new(_storer.Object, _targets.Object, _deployers.Object, _sites.Object);

        [Fact]
        public async Task DeployStaticSite_WhenNoGeneratedOutput_ThrowsXStaticExceptionExplainingToGenerateFirst()
        {
            // Regression for issue #77: this used to throw a bare FileNotFoundException with no message.
            var missingPath = Path.Combine(Path.GetTempPath(), "xstatic-missing-" + Guid.NewGuid().ToString("N"));

            var storer = new Mock<IStaticSiteStorer>();
            storer.Setup(s => s.GetStorageLocationOfSite(42)).Returns(missingPath);

            var sites = new Mock<ISitesRepository>();
            sites.Setup(s => s.Get<SiteConfig>(42)).Returns(new SiteConfig { Id = 42 });

            var process = new DeployProcess(storer.Object, Mock.Of<IDeploymentTargetRepository>(), Mock.Of<IDeployerService>(), sites.Object);

            var ex = await Assert.ThrowsAsync<XStaticException>(() => process.DeployStaticSite(42));

            Assert.Contains(missingPath, ex.Message);
            Assert.Contains("Generate the site before deploying", ex.Message);
        }

        [Fact]
        public async Task DeployStaticSite_Success_RecordsLastDeploy()
        {
            _deployer.Setup(d => d.DeployWholeSite(_outputFolder)).ReturnsAsync(XStaticResult.Success("deployed"));

            var result = await NewProcess().DeployStaticSite(SiteId);

            Assert.True(result.WasSuccessful);
            _sites.Verify(s => s.UpdateLastDeploy(SiteId, It.IsAny<int?>()), Times.Once);
        }

        [Fact]
        public async Task DeployStaticSite_Failure_ReturnsErrorAndDoesNotRecordLastDeploy()
        {
            _deployer.Setup(d => d.DeployWholeSite(_outputFolder)).ReturnsAsync(XStaticResult.Error("upload rejected"));

            var result = await NewProcess().DeployStaticSite(SiteId);

            Assert.False(result.WasSuccessful);
            Assert.Equal("upload rejected", result.Message);
            _sites.Verify(s => s.UpdateLastDeploy(It.IsAny<int>(), It.IsAny<int?>()), Times.Never);
        }

        [Fact]
        public async Task DeployStaticSite_SiteNotFound_Throws()
        {
            _sites.Setup(s => s.Get<SiteConfig>(SiteId)).Returns((SiteConfig)null!);

            var ex = await Assert.ThrowsAsync<XStaticException>(() => NewProcess().DeployStaticSite(SiteId));

            Assert.Contains("Site not found", ex.Message);
            _sites.Verify(s => s.UpdateLastDeploy(It.IsAny<int>(), It.IsAny<int?>()), Times.Never);
        }

        [Fact]
        public async Task DeployStaticSite_NoDeploymentTarget_Throws()
        {
            _sites.Setup(s => s.Get<SiteConfig>(SiteId)).Returns(new SiteConfig { Id = SiteId, DeploymentTarget = null });

            var ex = await Assert.ThrowsAsync<XStaticException>(() => NewProcess().DeployStaticSite(SiteId));

            Assert.Contains("Deployment target null", ex.Message);
        }

        [Fact]
        public async Task DeployStaticSite_DeploymentTargetMissing_Throws()
        {
            _targets.Setup(t => t.Get(TargetId)).Returns((DeploymentTargetDataModel)null!);

            var ex = await Assert.ThrowsAsync<XStaticException>(() => NewProcess().DeployStaticSite(SiteId));

            Assert.Contains("Deployment target not found", ex.Message);
            _deployer.Verify(d => d.DeployWholeSite(It.IsAny<string>()), Times.Never);
        }
    }
}
