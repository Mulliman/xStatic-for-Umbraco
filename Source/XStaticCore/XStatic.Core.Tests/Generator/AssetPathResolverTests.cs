using System;
using System.IO;
using System.Linq;
using Moq;
using XStatic.Core.Generator.Jobs;
using XStatic.Core.Generator.Processes;
using XStatic.Core.Generator.Storage;
using Xunit;

namespace XStatic.Core.Tests.Generator
{
    public sealed class AssetPathResolverTests : IDisposable
    {
        private readonly string _root;
        private readonly string _webRoot;
        private readonly string _contentRoot;

        public AssetPathResolverTests()
        {
            _root = Path.Combine(Path.GetTempPath(), "xstatic-tests-" + Guid.NewGuid().ToString("N"));
            _contentRoot = Path.Combine(_root, "content");
            _webRoot = Path.Combine(_contentRoot, "wwwroot");
            Directory.CreateDirectory(_webRoot);
        }

        public void Dispose()
        {
            try { Directory.Delete(_root, recursive: true); } catch { /* best effort */ }
        }

        private static JobBuilder NewBuilder() => new JobBuilder(1, Mock.Of<IFileNameGenerator>());

        private AssetPathResolver NewResolver() => new AssetPathResolver(_webRoot, _contentRoot);

        private static void CreateFile(string path)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(path)!);
            File.WriteAllText(path, "test");
        }

        [Fact]
        public void WildcardPath_WhereFolderMissingFromBothRoots_DoesNotThrow_AndReportsError()
        {
            // Regression for issue #77: this used to throw DirectoryNotFoundException and abort generation.
            var builder = NewBuilder();

            var results = NewResolver().AddAssetsToBuilder("/App_Plugins/UmbracoForms/Assets/*", builder);

            var result = Assert.Single(results);
            Assert.False(result.WasSuccessful);
            Assert.Equal(AssetPathResolver.ResultType, result.Type);
            Assert.Equal("/App_Plugins/UmbracoForms/Assets/*", result.Item);
            Assert.Contains("not found", result.Message);
            Assert.Empty(builder.Build().Files);
        }

        [Fact]
        public void MissingPath_DoesNotStopOtherPathsBeingAdded()
        {
            CreateFile(Path.Combine(_webRoot, "css", "site.css"));
            var builder = NewBuilder();

            var results = NewResolver().AddAssetsToBuilder("/App_Plugins/Missing/*, /css/*", builder);

            Assert.Single(results);
            Assert.Equal("/App_Plugins/Missing/*", results[0].Item);
            Assert.Contains(builder.Build().Files.Values, v => v.Replace('\\', '/') == "/css/site.css");
        }

        [Fact]
        public void WildcardPath_InWebRoot_AddsMatchingFiles()
        {
            CreateFile(Path.Combine(_webRoot, "css", "site.css"));
            CreateFile(Path.Combine(_webRoot, "css", "other.css"));
            var builder = NewBuilder();

            var results = NewResolver().AddAssetsToBuilder("/css/*", builder);

            Assert.Empty(results);
            Assert.Equal(2, builder.Build().Files.Count);
        }

        [Fact]
        public void WildcardPath_OnlyInContentRoot_FallsBackToContentRoot()
        {
            CreateFile(Path.Combine(_contentRoot, "App_Plugins", "Pkg", "Assets", "pkg.js"));
            var builder = NewBuilder();

            var results = NewResolver().AddAssetsToBuilder("/App_Plugins/Pkg/Assets/*", builder);

            Assert.Empty(results);
            var file = Assert.Single(builder.Build().Files);
            Assert.Equal(Path.Combine(_contentRoot, "App_Plugins", "Pkg", "Assets", "pkg.js"), file.Key);
            Assert.Equal("/App_Plugins/Pkg/Assets/pkg.js", file.Value.Replace('\\', '/'));
        }

        [Fact]
        public void NonWildcardPath_ThatDoesNotExist_ReportsError()
        {
            var builder = NewBuilder();

            var results = NewResolver().AddAssetsToBuilder("/missing-folder", builder);

            var result = Assert.Single(results);
            Assert.False(result.WasSuccessful);
            Assert.Equal("/missing-folder", result.Item);
            var job = builder.Build();
            Assert.Empty(job.Files);
            Assert.Empty(job.Folders);
        }

        [Fact]
        public void FolderAndFilePaths_AreAddedFromEitherRoot()
        {
            Directory.CreateDirectory(Path.Combine(_webRoot, "images"));
            CreateFile(Path.Combine(_contentRoot, "robots.txt"));
            var builder = NewBuilder();

            var results = NewResolver().AddAssetsToBuilder("/images,/robots.txt", builder);

            Assert.Empty(results);
            var job = builder.Build();
            Assert.Equal("/images", Assert.Single(job.Folders).Value);
            Assert.Equal("/robots.txt", Assert.Single(job.Files).Value);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData(" , ")]
        public void EmptyConfig_AddsNothing(string? assetPaths)
        {
            var builder = NewBuilder();

            var results = NewResolver().AddAssetsToBuilder(assetPaths!, builder);

            Assert.Empty(results);
            Assert.Empty(builder.Build().Files);
            Assert.Empty(builder.Build().Folders);
        }

        [Fact]
        public void MissingWebRoot_StillResolvesFromContentRoot()
        {
            CreateFile(Path.Combine(_contentRoot, "assets", "a.js"));
            var builder = NewBuilder();

            var results = new AssetPathResolver(null!, _contentRoot).AddAssetsToBuilder("/assets/*", builder);

            Assert.Empty(results);
            Assert.Single(builder.Build().Files);
        }
    }
}
