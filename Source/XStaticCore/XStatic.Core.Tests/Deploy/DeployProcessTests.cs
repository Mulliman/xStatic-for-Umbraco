using System;
using System.IO;
using System.Threading.Tasks;
using Moq;
using XStatic.Core.Deploy;
using XStatic.Core.Deploy.Processes;
using XStatic.Core.Deploy.Targets;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Repositories;
using Xunit;

namespace XStatic.Core.Tests.Deploy
{
    public class DeployProcessTests
    {
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
    }
}
