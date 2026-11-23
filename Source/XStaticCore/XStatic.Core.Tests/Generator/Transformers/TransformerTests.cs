using System;
using System.Collections.Generic;
using Moq;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Web;
using XStatic.Core.Generator;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;
using Xunit;

namespace XStatic.Core.Tests.Generator.Transformers
{
    public class CachedByTransformerTests
    {
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        public void Transform_NullOrEmpty_ReturnsInput(string? input)
        {
            Assert.Equal(input, new CachedByTransformer().Transform(input!, Mock.Of<IUmbracoContext>()));
        }

        [Fact]
        public void Transform_AddsCommentBeforeClosingBody()
        {
            var output = new CachedByTransformer().Transform("<html><body><p>Hi</p></body></html>", Mock.Of<IUmbracoContext>());

            Assert.Equal("<html><body><p>Hi</p><!-- Cached by xStatic --></body></html>", output);
        }

        [Fact]
        public void Transform_WithoutClosingBody_IsUnchanged()
        {
            const string json = "{\"name\":\"value\"}";

            Assert.Equal(json, new CachedByTransformer().Transform(json, Mock.Of<IUmbracoContext>()));
        }
    }

    public class CachedTimeTransformerTests
    {
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        public void Transform_NullOrEmpty_ReturnsInput(string? input)
        {
            Assert.Equal(input, new CachedTimeTransformer().Transform(input!, Mock.Of<IUmbracoContext>()));
        }

        [Fact]
        public void Transform_AddsTimestampedCommentBeforeClosingBody()
        {
            var output = new CachedTimeTransformer().Transform("<body></body>", Mock.Of<IUmbracoContext>());

            Assert.StartsWith("<body><!-- Cached by xStatic at ", output);
            Assert.EndsWith(" --></body>", output);
        }
    }

    public class HostnameTransformerTests
    {
        private static IUmbracoContext ContextWithDomains(params string[] domainNames)
        {
            var domains = new List<Domain>();
            for (var i = 0; i < domainNames.Length; i++)
            {
                domains.Add(new Domain(i + 1, domainNames[i], 1000, "en-US", false, i));
            }

            var domainCache = new Mock<IDomainCache>();
            domainCache.Setup(d => d.GetAll(false)).Returns(domains);

            var context = new Mock<IUmbracoContext>();
            context.Setup(c => c.Domains).Returns(domainCache.Object);
            return context.Object;
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        public void Transform_NullOrEmpty_ReturnsInputWithoutTouchingContext(string? input)
        {
            // A strict mock fails the test if the transformer reads the domain cache.
            var context = new Mock<IUmbracoContext>(MockBehavior.Strict);

            Assert.Equal(input, new HostnameTransformer("static.example.com").Transform(input!, context.Object));
        }

        [Fact]
        public void Transform_ReplacesEveryConfiguredDomain()
        {
            var context = ContextWithDomains("cms.example.com", "cms.example.co.uk");
            var transformer = new HostnameTransformer("www.example.com");

            var output = transformer.Transform(
                "<a href=\"https://cms.example.com/about\">A</a><a href=\"https://cms.example.co.uk/\">B</a>", context);

            Assert.Equal("<a href=\"https://www.example.com/about\">A</a><a href=\"https://www.example.com/\">B</a>", output);
        }

        [Fact]
        public void Transform_WithNoDomains_IsUnchanged()
        {
            const string html = "<a href=\"https://cms.example.com/\">A</a>";

            Assert.Equal(html, new HostnameTransformer("www.example.com").Transform(html, ContextWithDomains()));
        }

        [Fact]
        public void Transform_ReadsDomainsOnlyOnce()
        {
            var domainCache = new Mock<IDomainCache>();
            domainCache.Setup(d => d.GetAll(false)).Returns(new[] { new Domain(1, "cms.example.com", 1000, "en-US", false, 0) });
            var context = new Mock<IUmbracoContext>();
            context.Setup(c => c.Domains).Returns(domainCache.Object);
            var transformer = new HostnameTransformer("www.example.com");

            transformer.Transform("cms.example.com/a", context.Object);
            transformer.Transform("cms.example.com/b", context.Object);

            domainCache.Verify(d => d.GetAll(false), Times.Once);
        }
    }

    public class CroppedImageUrlTransformerTests
    {
        private static CroppedImageUrlTransformer NewTransformer(params Crop[] crops)
            => new CroppedImageUrlTransformer(new ImageCropNameGenerator(), crops);

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        public void Transform_NullOrEmpty_ReturnsInput(string? input)
        {
            Assert.Equal(input, NewTransformer(new Crop(100, 50)).Transform(input!, Mock.Of<IUmbracoContext>()));
        }

        [Fact]
        public void Transform_WithNoCrops_IsUnchanged()
        {
            const string html = "<img src=\"/media/abc/photo.jpg?width=100&height=50\" />";

            Assert.Equal(html, NewTransformer().Transform(html, Mock.Of<IUmbracoContext>()));
            Assert.Equal(html, new CroppedImageUrlTransformer(new ImageCropNameGenerator(), null!).Transform(html, Mock.Of<IUmbracoContext>()));
        }

        [Fact]
        public void Transform_RewritesFileNameOfMatchingCrop()
        {
            var output = NewTransformer(new Crop(100, 50))
                .Transform("<img src=\"/media/abc/photo.jpg?width=100&height=50\" />", Mock.Of<IUmbracoContext>());

            Assert.Equal("<img src=\"/media/abc/photo--100x50.jpg?width=100&height=50\" />", output);
        }

        [Fact]
        public void Transform_RewritesCssUrlInParentheses()
        {
            var output = NewTransformer(new Crop(800, 600))
                .Transform("background-image: url(/media/x/hero.png?width=800&height=600);", Mock.Of<IUmbracoContext>());

            Assert.Equal("background-image: url(/media/x/hero--800x600.png?width=800&height=600);", output);
        }

        [Fact]
        public void Transform_LeavesNonMatchingSizeAlone()
        {
            const string html = "<img src=\"/media/abc/photo.jpg?width=200&height=50\" />";

            Assert.Equal(html, NewTransformer(new Crop(100, 50)).Transform(html, Mock.Of<IUmbracoContext>()));
        }

        [Fact]
        public void Transform_LeavesNonMediaUrlsAlone()
        {
            const string html = "<img src=\"/images/photo.jpg?width=100&height=50\" />";

            Assert.Equal(html, NewTransformer(new Crop(100, 50)).Transform(html, Mock.Of<IUmbracoContext>()));
        }
    }

    public class UmbracoContentUdiToJsonUrlTransformerTests
    {
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        public void Transform_NullOrEmpty_ReturnsInput(string? input)
        {
            Assert.Equal(input, new UmbracoContentUdiToJsonUrlTransformer().Transform(input!, Mock.Of<IUmbracoContext>()));
        }

        [Fact]
        public void Transform_WithoutUdis_IsUnchanged()
        {
            const string json = "{\"link\":\"/about/\"}";

            Assert.Equal(json, new UmbracoContentUdiToJsonUrlTransformer().Transform(json, Mock.Of<IUmbracoContext>()));
        }

        [Fact]
        public void Transform_UdiForMissingContent_IsLeftAsIs()
        {
            var key = Guid.NewGuid();
            var cache = new Mock<IPublishedContentCache>();
            cache.Setup(c => c.GetById(key)).Returns((IPublishedContent?)null);
            var context = new Mock<IUmbracoContext>();
            context.Setup(c => c.Content).Returns(cache.Object);

            var json = $"{{\"link\":\"umb://document/{key:N}\"}}";

            Assert.Equal(json, new UmbracoContentUdiToJsonUrlTransformer().Transform(json, context.Object));
            cache.Verify(c => c.GetById(key), Times.Once);
        }
    }
}
