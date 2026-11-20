using System.Linq;
using XStatic.Core.Generator;
using XStatic.Core.Generator.Storage;
using Xunit;

namespace XStatic.Core.Tests.Generator.Storage
{
    public class EverythingIsIndexHtmlFileNameGeneratorTests
    {
        [Theory]
        [InlineData("/about/", "about/index.html")]
        [InlineData("/about", "about/index.html")]
        [InlineData("about/team/", "about/team/index.html")]
        [InlineData("/blog/2026/post/", "blog/2026/post/index.html")]
        public void GetFilePartialPath_PutsEachPageInItsOwnFolder(string url, string expected)
        {
            Assert.Equal(expected, new EverythingIsIndexHtmlFileNameGenerator().GetFilePartialPath(url));
        }

        [Fact]
        public void GetFilePartialPath_ForRoot_ReturnsRootedIndex()
        {
            // The leading slash is harmless: storers combine it with FileHelpers.PathCombine, which strips it.
            Assert.Equal("/index.html", new EverythingIsIndexHtmlFileNameGenerator().GetFilePartialPath("/"));
        }
    }

    public class JsonFileNameGeneratorTests
    {
        [Theory]
        [InlineData("/about/", "about.json")]
        [InlineData("/about", "about.json")]
        [InlineData("/blog/post/", "blog/post.json")]
        [InlineData("/", "index.json")]
        [InlineData("", "index.json")]
        [InlineData(null, "index.json")]
        public void GetFilePartialPath_MapsUrlToJsonFile(string? url, string expected)
        {
            Assert.Equal(expected, new JsonFileNameGenerator().GetFilePartialPath(url!));
        }
    }

    public class ImageCropNameGeneratorTests
    {
        [Theory]
        [InlineData(100, 50, "photo--100x50")]
        [InlineData(100, null, "photo--100x0")]
        [InlineData(null, 50, "photo--0x50")]
        [InlineData(null, null, "photo--0x0")]
        public void GetCropFileName_AppendsDimensions(int? width, int? height, string expected)
        {
            Assert.Equal(expected, new ImageCropNameGenerator().GetCropFileName("photo", new Crop(width, height)));
        }

        [Fact]
        public void GetCropFileName_IgnoresQuality()
        {
            Assert.Equal("photo--100x50", new ImageCropNameGenerator().GetCropFileName("photo", new Crop(100, 50, 80)));
        }
    }

    public class FileNameGeneratorListTests
    {
        [Fact]
        public void FileNameGenerators_FindsBuiltInConcreteGenerators()
        {
            var types = new FileNameGeneratorList().FileNameGenerators;

            Assert.Contains(typeof(EverythingIsIndexHtmlFileNameGenerator), types);
            Assert.Contains(typeof(JsonFileNameGenerator), types);
            Assert.DoesNotContain(typeof(IFileNameGenerator), types);
            Assert.All(types, t => Assert.False(t.IsAbstract));
        }
    }
}
