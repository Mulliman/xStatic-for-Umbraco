using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Moq;
using XStatic.Core.Actions;
using XStatic.Core.Actions.Db;
using XStatic.Core.Actions.FileActions;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.ExportTypes;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Repositories;
using Xunit;

namespace XStatic.Core.Tests.Actions
{
    public class FileActionTests
    {
        private static readonly string SiteRoot = Path.Combine(Path.GetTempPath(), "xstatic-site-1");

        private static Mock<IStaticSiteStorer> NewStorer()
        {
            var storer = new Mock<IStaticSiteStorer>();
            storer.Setup(s => s.GetStorageLocationOfSite(1)).Returns(SiteRoot);
            return storer;
        }

        [Fact]
        public async Task FileCopyAction_CopiesFileFromSiteFolder()
        {
            var storer = NewStorer();

            var result = await new FileCopyAction(storer.Object).RunAction(1, new()
            {
                [FileCopyFields.FilePath] = "/404/index.html",
                [FileCopyFields.NewFilePath] = "404.html",
            });

            Assert.True(result.WasSuccessful);
            storer.Verify(s => s.CopyFile("1", Path.Combine(SiteRoot, "404/index.html"), "404.html"));
        }

        [Fact]
        public async Task FileRenameAction_MovesFileFromSiteFolder()
        {
            var storer = NewStorer();

            var result = await new FileRenameAction(storer.Object).RunAction(1, new()
            {
                [FileRenameFields.FilePath] = "old.html",
                [FileRenameFields.NewFilePath] = "new.html",
            });

            Assert.True(result.WasSuccessful);
            storer.Verify(s => s.MoveFile("1", Path.Combine(SiteRoot, "old.html"), "new.html"));
        }

        [Fact]
        public async Task FileDeleteAction_DeletesFileInSiteFolder()
        {
            var storer = NewStorer();

            var result = await new FileDeleteAction(storer.Object).RunAction(1, new() { [FileDeleteFields.FilePath] = "/unwanted.txt" });

            Assert.True(result.WasSuccessful);
            storer.Verify(s => s.DeleteFile(Path.Combine(SiteRoot, "unwanted.txt")));
        }

        [Fact]
        public async Task FileActions_StorerFailure_ReturnsErrorWithException()
        {
            var storer = NewStorer();
            var failure = new IOException("disk full");
            storer.Setup(s => s.CopyFile(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())).ThrowsAsync(failure);
            storer.Setup(s => s.MoveFile(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())).ThrowsAsync(failure);
            storer.Setup(s => s.DeleteFile(It.IsAny<string>())).ThrowsAsync(failure);
            var parameters = new Dictionary<string, string> { ["FilePath"] = "a", ["NewFilePath"] = "b" };

            var results = new[]
            {
                await new FileCopyAction(storer.Object).RunAction(1, parameters),
                await new FileRenameAction(storer.Object).RunAction(1, parameters),
                await new FileDeleteAction(storer.Object).RunAction(1, parameters),
            };

            Assert.All(results, r =>
            {
                Assert.False(r.WasSuccessful);
                Assert.Same(failure, r.Exception);
            });
        }
    }

    public class AddGenerationMetadataFileActionTests
    {
        private readonly Mock<ISitesRepository> _sites = new();
        private readonly Mock<IStaticSiteStorer> _storer = new();
        private readonly Mock<IExportTypeService> _exportTypes = new();

        private AddGenerationMetadataFileAction NewAction() => new(_sites.Object, _storer.Object, _exportTypes.Object);

        [Fact]
        public async Task RunAction_MissingSite_ReturnsError()
        {
            var result = await NewAction().RunAction(5, new());

            Assert.False(result.WasSuccessful);
            _storer.Verify(s => s.StoreSiteItem(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Encoding>()), Times.Never);
        }

        [Fact]
        public async Task RunAction_WritesMetadataFileWithSetValuesOnly()
        {
            var exportTypeId = 3;
            _sites.Setup(s => s.Get<SiteConfig>(5)).Returns(new SiteConfig
            {
                Id = 5,
                Name = "My site",
                RootNode = Guid.Parse("11111111-2222-3333-4444-555555555555"),
                ExportFormat = exportTypeId,
                TargetHostname = "www.example.com",
            });
            _exportTypes.Setup(e => e.GetExportTypes()).Returns(new[] { Mock.Of<IExportTypeFields>(t => t.Id == exportTypeId && t.Name == "HTML") });
            string? written = null;
            _storer.Setup(s => s.StoreSiteItem("5", ".xstatic-metadata", It.IsAny<string>(), Encoding.UTF8))
                .Callback<string, string, string, Encoding>((_, _, contents, _) => written = contents)
                .ReturnsAsync("path");

            var result = await NewAction().RunAction(5, new());

            Assert.True(result.WasSuccessful);
            Assert.NotNull(written);
            Assert.Contains("Id: 5", written);
            Assert.Contains("Name: My site", written);
            Assert.Contains("ExportFormat: HTML", written);
            Assert.Contains("TargetHostname: www.example.com", written);
            Assert.DoesNotContain("ImageCrops:", written);
            Assert.DoesNotContain("AssetPaths:", written);
        }

        [Fact]
        public async Task RunAction_UnknownExportType_WritesUnknown()
        {
            _sites.Setup(s => s.Get<SiteConfig>(5)).Returns(new SiteConfig { Id = 5, ExportFormat = 99 });
            _exportTypes.Setup(e => e.GetExportTypes()).Returns(Array.Empty<IExportTypeFields>());
            string? written = null;
            _storer.Setup(s => s.StoreSiteItem(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Encoding>()))
                .Callback<string, string, string, Encoding>((_, _, contents, _) => written = contents)
                .ReturnsAsync("path");

            await NewAction().RunAction(5, new());

            Assert.Contains("ExportFormat: Unknown", written);
        }

        [Fact]
        public async Task RunAction_StorerFailure_ReturnsError()
        {
            _sites.Setup(s => s.Get<SiteConfig>(5)).Returns(new SiteConfig { Id = 5 });
            _exportTypes.Setup(e => e.GetExportTypes()).Returns(Array.Empty<IExportTypeFields>());
            _storer.Setup(s => s.StoreSiteItem(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Encoding>()))
                .ThrowsAsync(new IOException());

            var result = await NewAction().RunAction(5, new());

            Assert.False(result.WasSuccessful);
            Assert.IsType<IOException>(result.Exception);
        }
    }

    public class ActionFactoryTests
    {
        public class ParameterlessAction : IPostGenerationAction
        {
            public string Name => "Parameterless";

            public Task<XStaticResult> RunAction(int staticSiteId, Dictionary<string, string> parameters)
                => Task.FromResult(XStaticResult.Success());
        }

        private static string TypeName<T>() => typeof(T).AssemblyQualifiedName!;

        private readonly Mock<IActionRepository> _repo = new();
        private readonly Mock<IServiceProvider> _services = new();

        private ActionFactory NewFactory() => new(_repo.Object, _services.Object);

        [Fact]
        public void CreatePostGenerationAction_NullDataOrType_ReturnsNull()
        {
            Assert.Null(NewFactory().CreatePostGenerationAction((ActionDataModel)null!));
            Assert.Null(NewFactory().CreatePostGenerationAction(new ActionDataModel { Type = null }));
        }

        [Fact]
        public void CreatePostGenerationAction_UnknownType_ReturnsNull()
        {
            Assert.Null(NewFactory().CreatePostGenerationAction(new ActionDataModel { Type = "No.Such.Type, NoSuchAssembly" }));
        }

        [Fact]
        public void CreatePostGenerationAction_PrefersInstanceFromServiceProvider()
        {
            var registered = new FileDeleteAction(Mock.Of<IStaticSiteStorer>());
            _services.Setup(s => s.GetService(typeof(FileDeleteAction))).Returns(registered);

            var action = NewFactory().CreatePostGenerationAction(new ActionDataModel { Type = TypeName<FileDeleteAction>() });

            Assert.Same(registered, action);
        }

        [Fact]
        public void CreatePostGenerationAction_FallsBackToParameterlessConstructor()
        {
            var action = NewFactory().CreatePostGenerationAction(new ActionDataModel { Type = TypeName<ParameterlessAction>() });

            Assert.IsType<ParameterlessAction>(action);
        }

        [Fact]
        public void CreateConfiguredPostGenerationActions_SkipsActionsThatCannotBeCreated()
        {
            var config = new Dictionary<string, string> { ["FilePath"] = "a" };
            _repo.Setup(r => r.Get(1)).Returns(new ActionDataModel { Type = TypeName<ParameterlessAction>(), Config = config });
            _repo.Setup(r => r.Get(2)).Returns(new ActionDataModel { Type = "No.Such.Type" });

            var actions = NewFactory().CreateConfiguredPostGenerationActions(1, 2).ToList();

            var configured = Assert.Single(actions);
            Assert.Equal("Parameterless", configured.Name);
            Assert.Same(config, configured.Config);
        }

        [Fact]
        public void CreatePostGenerationActions_NoIds_ReturnsEmpty()
        {
            Assert.Empty(NewFactory().CreatePostGenerationActions());
            Assert.Empty(NewFactory().CreatePostGenerationActions(null!));
            Assert.Empty(NewFactory().CreateConfiguredPostGenerationActions());
        }
    }
}
