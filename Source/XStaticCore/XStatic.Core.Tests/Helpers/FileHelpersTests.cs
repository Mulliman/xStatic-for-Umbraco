using System;
using System.IO;
using System.Threading.Tasks;
using XStatic.Core.Helpers;
using Xunit;

namespace XStatic.Core.Tests.Helpers
{
    public sealed class FileHelpersTests : IDisposable
    {
        private readonly string _root = Path.Combine(Path.GetTempPath(), "xstatic-tests-" + Guid.NewGuid().ToString("N"));

        public FileHelpersTests() => Directory.CreateDirectory(_root);

        public void Dispose()
        {
            try { Directory.Delete(_root, recursive: true); } catch { /* best effort */ }
        }

        private string CreateFile(string relativePath, string contents = "test")
        {
            var path = Path.Combine(_root, relativePath);
            Directory.CreateDirectory(Path.GetDirectoryName(path)!);
            File.WriteAllText(path, contents);
            return path;
        }

        [Fact]
        public void PathCombine_StripsLeadingSlashSoSecondPathStaysUnderFirst()
        {
            var combined = FileHelpers.PathCombine(_root, "/about/index.html");

            Assert.Equal(Path.Combine(_root, "about/index.html"), combined);
        }

        [Fact]
        public void PathCombine_WithRelativePath_IsPlainCombine()
        {
            Assert.Equal(Path.Combine(_root, "a/b.txt"), FileHelpers.PathCombine(_root, "a/b.txt"));
        }

        [Fact]
        public void GetRelativePath_ReturnsPathRelativeToFolder()
        {
            var from = Path.Combine(_root, "site");
            var to = Path.Combine(_root, "site", "css", "main.css");

            Assert.Equal(Path.Combine("css", "main.css"), FileHelpers.GetRelativePath(from, to));
        }

        [Theory]
        [InlineData(null, "x")]
        [InlineData("", "x")]
        [InlineData("x", null)]
        [InlineData("x", "")]
        public void GetRelativePath_NullOrEmpty_Throws(string? from, string? to)
        {
            Assert.Throws<ArgumentNullException>(() => FileHelpers.GetRelativePath(from!, to!));
        }

        [Theory]
        [InlineData(0, "0B")]
        [InlineData(512, "512B")]
        [InlineData(1024, "1KB")]
        [InlineData(1536, "1.5KB")]
        [InlineData(1048576, "1MB")]
        [InlineData(-2048, "-2KB")]
        public void BytesToString_FormatsWithLargestUnit(long bytes, string expected)
        {
            // Avoid culture-dependent decimal separators.
            var previous = System.Globalization.CultureInfo.CurrentCulture;
            System.Globalization.CultureInfo.CurrentCulture = System.Globalization.CultureInfo.InvariantCulture;
            try
            {
                Assert.Equal(expected, FileHelpers.BytesToString(bytes));
            }
            finally
            {
                System.Globalization.CultureInfo.CurrentCulture = previous;
            }
        }

        [Fact]
        public void GetDirectorySize_SumsFilesRecursively()
        {
            CreateFile("a.txt", "12345");
            CreateFile("sub/b.txt", "123");

            Assert.Equal(8, FileHelpers.GetDirectorySize(new DirectoryInfo(_root)));
            Assert.Equal(5, FileHelpers.GetDirectorySize(new DirectoryInfo(_root), recursive: false));
        }

        [Fact]
        public void GetDirectorySize_MissingOrNullFolder_IsZero()
        {
            Assert.Equal(0, FileHelpers.GetDirectorySize(null!));
            Assert.Equal(0, FileHelpers.GetDirectorySize(new DirectoryInfo(Path.Combine(_root, "missing"))));
        }

        [Fact]
        public void DeleteFolderContents_DeletesEverythingExceptIgnoredPaths()
        {
            CreateFile("index.html");
            CreateFile("CNAME");
            CreateFile("css/main.css");
            CreateFile(".git/HEAD");

            FileHelpers.DeleteFolderContents(_root, FileHelpers.DefaultNonDeletePaths);

            Assert.True(Directory.Exists(_root));
            Assert.False(File.Exists(Path.Combine(_root, "index.html")));
            Assert.False(Directory.Exists(Path.Combine(_root, "css")));
            Assert.True(File.Exists(Path.Combine(_root, "CNAME")));
            Assert.True(File.Exists(Path.Combine(_root, ".git", "HEAD")));
        }

        [Fact]
        public void GetDoNotDeletePaths_NoneConfigured_ReturnsDefaults()
        {
            Assert.Equal(FileHelpers.DefaultNonDeletePaths, FileHelpers.GetDoNotDeletePaths(null!));
            Assert.Equal(FileHelpers.DefaultNonDeletePaths, FileHelpers.GetDoNotDeletePaths(new string[0]));
            Assert.Equal(FileHelpers.DefaultNonDeletePaths, FileHelpers.GetDoNotDeletePaths(new[] { "", "  " }));
        }

        [Fact]
        public void GetDoNotDeletePaths_Configured_ReplacesDefaultsAndTrims()
        {
            Assert.Equal(new[] { ".well-known", "CNAME" }, FileHelpers.GetDoNotDeletePaths(new[] { " .well-known ", "", "CNAME" }));
        }

        [Fact]
        public void DeleteFolderContents_WithConfiguredPaths_KeepsOnlyThose()
        {
            CreateFile("CNAME");
            CreateFile(".well-known/security.txt");
            CreateFile("index.html");

            FileHelpers.DeleteFolderContents(_root, FileHelpers.GetDoNotDeletePaths(new[] { ".well-known" }));

            Assert.True(File.Exists(Path.Combine(_root, ".well-known", "security.txt")));
            Assert.False(File.Exists(Path.Combine(_root, "CNAME")));
            Assert.False(File.Exists(Path.Combine(_root, "index.html")));
        }

        [Fact]
        public void DeleteFolderContents_NullIgnoreList_DeletesEverything()
        {
            CreateFile("CNAME");
            CreateFile("sub/a.txt");

            FileHelpers.DeleteFolderContents(_root, null!);

            Assert.Empty(Directory.GetFileSystemEntries(_root));
        }

        [Fact]
        public void DeleteFolderContents_MissingFolder_DoesNothing()
        {
            FileHelpers.DeleteFolderContents(Path.Combine(_root, "missing"), null!);
        }

        [Fact]
        public void CopyFilesInFolder_CopiesRecursivelyAndOverwrites()
        {
            CreateFile("src/index.html", "new");
            CreateFile("src/css/main.css", "css");
            CreateFile("dest/index.html", "old");
            CreateFile("dest/keep.txt", "keep");

            FileHelpers.CopyFilesInFolder(Path.Combine(_root, "src"), Path.Combine(_root, "dest"));

            Assert.Equal("new", File.ReadAllText(Path.Combine(_root, "dest", "index.html")));
            Assert.Equal("css", File.ReadAllText(Path.Combine(_root, "dest", "css", "main.css")));
            Assert.True(File.Exists(Path.Combine(_root, "dest", "keep.txt")));
            Assert.True(File.Exists(Path.Combine(_root, "src", "index.html")));
        }

        [Fact]
        public void MoveFilesInFolder_MovesFilesAndFolders()
        {
            CreateFile("src/index.html", "page");
            CreateFile("src/css/main.css", "css");

            FileHelpers.MoveFilesInFolder(Path.Combine(_root, "src"), Path.Combine(_root, "dest"));

            Assert.Equal("page", File.ReadAllText(Path.Combine(_root, "dest", "index.html")));
            Assert.Equal("css", File.ReadAllText(Path.Combine(_root, "dest", "css", "main.css")));
            Assert.Empty(Directory.GetFileSystemEntries(Path.Combine(_root, "src")));
        }
    }

    public class TaskHelperTests
    {
        [Fact]
        public async Task FromResultOf_Func_ReturnsValue()
        {
            Assert.Equal(42, await TaskHelper.FromResultOf(() => 42));
        }

        [Fact]
        public async Task FromResultOf_Func_CapturesExceptionInTask()
        {
            var task = TaskHelper.FromResultOf<int>(() => throw new InvalidOperationException("boom"));

            Assert.True(task.IsFaulted);
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => task);
            Assert.Equal("boom", ex.Message);
        }

        [Fact]
        public async Task FromResultOf_Action_RunsActionAndCompletes()
        {
            var ran = false;

            await TaskHelper.FromResultOf(() => { ran = true; });

            Assert.True(ran);
        }

        [Fact]
        public async Task FromResultOf_Action_CapturesExceptionInTask()
        {
            var task = TaskHelper.FromResultOf(() => throw new InvalidOperationException());

            Assert.True(task.IsFaulted);
            await Assert.ThrowsAsync<InvalidOperationException>(() => task);
        }
    }
}
