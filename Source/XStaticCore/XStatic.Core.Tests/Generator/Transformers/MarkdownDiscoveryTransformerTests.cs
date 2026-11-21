using System.Linq;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.Transformers;
using Xunit;

namespace XStatic.Core.Tests.Generator.Transformers
{
    public class MarkdownDiscoveryTransformerTests
    {
        [Fact]
        public void Transform_InjectsAlternateMarkdownLink_FromCanonicalUrl_AndPreservesCanonicalAndJsonLd()
        {
            var jsonLd = """{"@context":"https://schema.org","@type":"Article","headline":"Hello"}""";
            var html = $"""
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Hello</title>
                    <link rel="canonical" href="https://example.com/blog/hello/" />
                    <script type="application/ld+json">{jsonLd}</script>
                </head>
                <body><h1>Hello</h1></body>
                </html>
                """;

            var transformer = new MarkdownDiscoveryTransformer("https://example.com");
            var result = transformer.Transform(html, null);

            Assert.Contains("<link rel=\"alternate\" type=\"text/markdown\" href=\"https://example.com/blog/hello/index.md\" />", result);
            Assert.Contains("<link rel=\"canonical\" href=\"https://example.com/blog/hello/\" />", result);
            Assert.Contains($"<script type=\"application/ld+json\">{jsonLd}</script>", result);

            var validation = MarkdownDiscoveryTransformer.ValidateJsonLd(result);
            var block = Assert.Single(validation);
            Assert.True(block.IsValid);
        }

        [Fact]
        public void Transform_DerivesHrefFromOgUrl_WhenCanonicalMissing_AndResolvesHostname()
        {
            var html = """
                <html>
                <head>
                    <meta property="og:url" content="/docs/install/" />
                </head>
                <body></body>
                </html>
                """;

            var transformer = new MarkdownDiscoveryTransformer(
                targetHostname: "https://docs.example.com/",
                ensureCanonicalFromOgUrl: true);

            var result = transformer.Transform(html, null);

            Assert.Contains("<link rel=\"canonical\" href=\"https://docs.example.com/docs/install/\" />", result);
            Assert.Contains("<link rel=\"alternate\" type=\"text/markdown\" href=\"https://docs.example.com/docs/install/index.md\" />", result);
        }

        [Fact]
        public void Transform_FallsBackToRelativeIndexMd_WhenNoUrlMetadataPresent()
        {
            var html = "<html><head><title>Simple</title></head><body><p>Hi</p></body></html>";

            var transformer = new MarkdownDiscoveryTransformer();
            var result = transformer.Transform(html, null);

            Assert.Contains("<link rel=\"alternate\" type=\"text/markdown\" href=\"index.md\" />", result);
        }

        [Fact]
        public void Transform_IsIdempotent_DoesNotDuplicateExistingMarkdownAlternateLink()
        {
            var html = """
                <html>
                <head>
                    <link rel="alternate" type="text/markdown" href="https://example.com/about/index.md" />
                </head>
                <body></body>
                </html>
                """;

            var transformer = new MarkdownDiscoveryTransformer("https://example.com");
            var result = transformer.Transform(html, null);

            Assert.Equal(html, result);
        }

        [Fact]
        public void ValidateJsonLd_DetectsInvalidJsonBlock()
        {
            var html = """
                <html>
                <head>
                    <script type="application/ld+json">{ invalid json</script>
                </head>
                <body></body>
                </html>
                """;

            var validation = MarkdownDiscoveryTransformer.ValidateJsonLd(html);

            var block = Assert.Single(validation);
            Assert.False(block.IsValid);
            Assert.False(string.IsNullOrEmpty(block.Error));
        }

        [Fact]
        public void GeoHtmlTransformerListFactory_IncludesBaseTransformersAndMarkdownDiscoveryAfterHostname()
        {
            var siteConfig = new SiteConfig
            {
                TargetHostname = "https://example.com",
                ImageCrops = "800x600"
            };

            var factory = new GeoHtmlTransformerListFactory();
            var transformers = factory.BuildTransformers(siteConfig).ToList();

            Assert.Contains(transformers, t => t is CachedByTransformer);
            Assert.Contains(transformers, t => t is CroppedImageUrlTransformer);
            Assert.Contains(transformers, t => t is HostnameTransformer);
            Assert.IsType<MarkdownDiscoveryTransformer>(transformers.Last());
        }
    }
}
