using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using XStatic.Core.App;
using XStatic.Core.Deploy;
using XStatic.Core.Deploy.Targets;
using XStatic.Core.Deploy.Targets.Creators;
using Xunit;

namespace XStatic.Core.Tests.Deploy
{
    public class DeployerServiceTests
    {
        private static IDeployerDefinition Definition(string id)
            => Mock.Of<IDeployerDefinition>(d => d.Id == id && d.Name == id);

        [Fact]
        public void GetDeployer_InvokesRegisteredConstructorWithConfig()
        {
            Dictionary<string, string>? received = null;
            var deployer = Mock.Of<IDeployer>();
            var service = new DeployerService(
                new() { ["test"] = p => { received = p; return deployer; } },
                new() { ["test"] = Definition("test") });
            var config = new Dictionary<string, string> { ["key"] = "value" };

            Assert.Same(deployer, service.GetDeployer("test", config));
            Assert.Same(config, received);
        }

        [Fact]
        public void GetDeployer_UnknownKey_ThrowsArgumentException()
        {
            var service = new DeployerService(new(), new());

            var ex = Assert.Throws<ArgumentException>(() => service.GetDeployer("missing", new()));
            Assert.Contains("missing", ex.Message);
        }

        [Fact]
        public void GetDefinition_ReturnsDefinitionOrNull()
        {
            var definition = Definition("test");
            var service = new DeployerService(new(), new() { ["test"] = definition });

            Assert.Same(definition, service.GetDefinition("test"));
            Assert.Null(service.GetDefinition("missing"));
            Assert.Equal(new[] { definition }, service.GetDefinitions());
        }
    }

    public class DeployServiceBuilderTests
    {
        [Fact]
        public void AddDeployer_ThenBuild_RegistersServices()
        {
            var services = new ServiceCollection();
            var deployer = Mock.Of<IDeployer>();
            var definition = Mock.Of<IDeployerDefinition>(d => d.Id == "custom");

            new DeployServiceBuilder(services).AddDeployer(definition, _ => deployer).Build();

            using var provider = services.BuildServiceProvider();
            var deployerService = provider.GetRequiredService<IDeployerService>();
            Assert.Same(deployer, deployerService.GetDeployer("custom", new()));
            Assert.NotNull(provider.GetService<IDeploymentTargetCreatorService>());
            Assert.Contains(services, s => s.ServiceType == typeof(IDeploymentTargetRepository));
        }

        [Fact]
        public void AddDeployer_DuplicateId_Throws()
        {
            var builder = new DeployServiceBuilder(new ServiceCollection());
            var definition = Mock.Of<IDeployerDefinition>(d => d.Id == "dup");
            builder.AddDeployer(definition, _ => Mock.Of<IDeployer>());

            Assert.Throws<ArgumentException>(() => builder.AddDeployer(definition, _ => Mock.Of<IDeployer>()));
        }

        [Fact]
        public void AddDeployersAutomatically_FindsBuiltInAndPluginDeployers()
        {
            var builder = new DeployServiceBuilder(new ServiceCollection());

            // Load the plugin assemblies the test project references, so reflection can see them.
            _ = typeof(XStatic.Netlify.NetlifyDeployer).Assembly;
            _ = typeof(XStatic.Git.GitDeployer).Assembly;
            _ = typeof(XStatic.Ftp.FtpDeployer).Assembly;

            builder.AddDeployersAutomatically();

            Assert.Contains(FileSystemDeployer.DeployerKey, builder._definitions.Keys);
            Assert.Contains(XStatic.Netlify.NetlifyDeployer.DeployerKey, builder._definitions.Keys);
            Assert.Equal(builder._definitions.Keys.OrderBy(k => k), builder._deployers.Keys.OrderBy(k => k));
        }
    }

    public sealed class FileSystemDeployerTests : IDisposable
    {
        private readonly string _root = Path.Combine(Path.GetTempPath(), "xstatic-tests-" + Guid.NewGuid().ToString("N"));

        public void Dispose()
        {
            try { Directory.Delete(_root, recursive: true); } catch { /* best effort */ }
        }

        private static FileSystemDeployer NewDeployer(string target)
            => new FileSystemDeployer(new Dictionary<string, string> { [FileSystemDeployerDefinition.FieldNames.FolderPath] = target });

        [Fact]
        public void Constructor_MissingFolderPath_Throws()
        {
            Assert.Throws<KeyNotFoundException>(() => new FileSystemDeployer(new Dictionary<string, string>()));
        }

        [Fact]
        public async Task DeployWholeSite_CopiesGeneratedSiteToTargetFolder()
        {
            var source = Path.Combine(_root, "source");
            var target = Path.Combine(_root, "target");
            Directory.CreateDirectory(Path.Combine(source, "about"));
            File.WriteAllText(Path.Combine(source, "about", "index.html"), "about");

            var result = await NewDeployer(target).DeployWholeSite(source);

            Assert.True(result.WasSuccessful, result.Message);
            Assert.Equal("about", File.ReadAllText(Path.Combine(target, "about", "index.html")));
        }

        [Fact]
        public async Task DeployWholeSite_MissingSource_ReturnsError()
        {
            var result = await NewDeployer(Path.Combine(_root, "target")).DeployWholeSite(Path.Combine(_root, "missing"));

            Assert.False(result.WasSuccessful);
            Assert.NotNull(result.Exception);
        }

        [Fact]
        public void Definition_ExposesFolderPathField()
        {
            var definition = new FileSystemDeployerDefinition();

            Assert.Equal(FileSystemDeployer.DeployerKey, definition.Id);
            Assert.Equal(FileSystemDeployerDefinition.FieldNames.FolderPath, Assert.Single(definition.Fields).Alias);
        }
    }
}
