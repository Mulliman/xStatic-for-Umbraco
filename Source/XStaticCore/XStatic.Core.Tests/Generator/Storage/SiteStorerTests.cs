using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using XStatic.Core.Generator.Storage;
using Xunit;

namespace XStatic.Core.Tests.Generator.Storage
{
    public abstract class SiteStorerTestBase : IDisposable
    {
        protected readonly string ContentRoot = Path.Combine(Path.GetTempPath(), "xstatic-tests-" + Guid.NewGuid().ToString("N"));

        protected string OutputRoot => Path.Combine(ContentRoot, "umbraco", "Data", "xStatic", "output");

        protected IWebHostEnvironment Environment => Mock.Of<IWebHostEnvironment>(e => e.ContentRootPath == ContentRoot);

        public void Dispose()
        {
            try { Directory.Delete(ContentRoot, recursive: true); } catch { /* best effort */ }
        }

        protected string CreateSourceFile(string contents)
        {
            var path = Path.Combine(ContentRoot, "source-" + Guid.NewGuid().ToString("N") + ".txt");
            Directory.CreateDirectory(ContentRoot);
            File.WriteAllText(path, contents);
            return path;
        }
    }

    public sealed class AppDataSiteStorerTests : SiteStorerTestBase
    {
        private AppDataSiteStorer NewStorer() => new AppDataSiteStorer(Environment, NullLogger<IStaticSiteStorer>.Instance);

        [Fact]
        public void Constructor_CreatesOutputFolder()
        {
            NewStorer();

            Assert.True(Directory.Exists(OutputRoot));
        }

        [Fact]
        public void GetStorageLocationOfSite_IsSiteIdFolderUnderOutput()
        {
            Assert.Equal(Path.Combine(OutputRoot, "7"), NewStorer().GetStorageLocationOfSite(7));
        }

        [Fact]
        public async Task StoreSiteItem_WritesFileInSiteFolderCreatingDirectories()
        {
            var path = await NewStorer().StoreSiteItem("7", "/about/index.html", "<p>About</p>", Encoding.UTF8);

            var expected = Path.Combine(OutputRoot, "7", "about", "index.html");
            Assert.Equal(Path.GetFullPath(expected), Path.GetFullPath(path));
            Assert.Equal("<p>About</p>", File.ReadAllText(expected));
        }

        [Fact]
        public async Task StoreSiteItem_OverwritesExistingFile()
        {
            var storer = NewStorer();
            await storer.StoreSiteItem("7", "index.html", "old", Encoding.UTF8);

            var path = await storer.StoreSiteItem("7", "index.html", "new", Encoding.UTF8);

            Assert.Equal("new", File.ReadAllText(path));
        }

        [Fact]
        public async Task CopyFile_CopiesIntoSiteFolderAndKeepsSource()
        {
            var source = CreateSourceFile("copy me");

            var path = await NewStorer().CopyFile("7", source, "assets/copied.txt");

            Assert.Equal("copy me", File.ReadAllText(Path.Combine(OutputRoot, "7", "assets", "copied.txt")));
            Assert.Equal(Path.GetFullPath(Path.Combine(OutputRoot, "7", "assets", "copied.txt")), Path.GetFullPath(path));
            Assert.True(File.Exists(source));
        }

        [Fact]
        public async Task CopyFile_ReplacesExistingDestination()
        {
            var storer = NewStorer();
            await storer.StoreSiteItem("7", "404.html", "old", Encoding.UTF8);

            await storer.CopyFile("7", CreateSourceFile("new"), "404.html");

            Assert.Equal("new", File.ReadAllText(Path.Combine(OutputRoot, "7", "404.html")));
        }

        [Fact]
        public async Task CopyFile_MissingSource_FaultsTask()
        {
            await Assert.ThrowsAsync<FileNotFoundException>(() => NewStorer().CopyFile("7", Path.Combine(ContentRoot, "missing.txt"), "x.txt"));
        }

        [Fact]
        public async Task MoveFile_MovesIntoSiteFolder()
        {
            var source = CreateSourceFile("move me");

            await NewStorer().MoveFile("7", source, "moved.txt");

            Assert.Equal("move me", File.ReadAllText(Path.Combine(OutputRoot, "7", "moved.txt")));
            Assert.False(File.Exists(source));
        }

        [Fact]
        public async Task DeleteFile_RemovesFile()
        {
            var storer = NewStorer();
            var path = await storer.StoreSiteItem("7", "unwanted.txt", "x", Encoding.UTF8);

            await storer.DeleteFile(path);

            Assert.False(File.Exists(path));
        }

        [Fact]
        public async Task SaveFile_WritesWholeStreamEvenIfAlreadyRead()
        {
            using var stream = new MemoryStream(Encoding.UTF8.GetBytes("image bytes"));
            stream.Seek(0, SeekOrigin.End);

            var path = await NewStorer().SaveFile("7", stream, "media/photo.jpg");

            Assert.Equal("image bytes", File.ReadAllText(path));
        }
    }

    public sealed class CustomDefinedSingleSiteStorerTests : SiteStorerTestBase
    {
        private CustomDefinedSingleSiteStorer NewStorer() => new CustomDefinedSingleSiteStorer(Environment, NullLogger<IStaticSiteStorer>.Instance, "my-site");

        private string SiteRoot => Path.Combine(OutputRoot, "my-site");

        [Fact]
        public void GetStorageLocationOfSite_IsTheNamedFolderForEverySite()
        {
            var storer = NewStorer();

            Assert.Equal(SiteRoot, storer.GetStorageLocationOfSite(1));
            Assert.Equal(SiteRoot, storer.GetStorageLocationOfSite(2));
            Assert.True(Directory.Exists(SiteRoot));
        }

        [Fact]
        public async Task StoreSiteItem_IgnoresSiteIdSubfolder()
        {
            await NewStorer().StoreSiteItem("7", "/about/index.html", "about", Encoding.UTF8);

            Assert.Equal("about", File.ReadAllText(Path.Combine(SiteRoot, "about", "index.html")));
            Assert.False(Directory.Exists(Path.Combine(SiteRoot, "7")));
        }

        [Fact]
        public async Task CopyAndMoveFile_WriteToNamedFolder()
        {
            var storer = NewStorer();

            await storer.CopyFile("7", CreateSourceFile("copied"), "a.txt");
            await storer.MoveFile("7", CreateSourceFile("moved"), "b.txt");

            Assert.Equal("copied", File.ReadAllText(Path.Combine(SiteRoot, "a.txt")));
            Assert.Equal("moved", File.ReadAllText(Path.Combine(SiteRoot, "b.txt")));
        }

        [Fact]
        public async Task SaveFile_WritesWholeStream()
        {
            using var stream = new MemoryStream(Encoding.UTF8.GetBytes("bytes"));
            stream.Seek(0, SeekOrigin.End);

            var path = await NewStorer().SaveFile("7", stream, "media/photo.jpg");

            Assert.Equal("bytes", File.ReadAllText(path));
        }
    }
}
