using XStatic.Core.Generator.Markdown;
using Xunit;

namespace XStatic.Core.Tests.Generator.Markdown
{
    public class HtmlToMarkdownConverterTests
    {
        private readonly HtmlToMarkdownConverter _converter = new();

        [Fact]
        public void Convert_StripsNavigationChromeScriptsAndStyles_AndExtractsMainContent()
        {
            var html = """
                <!DOCTYPE html>
                <html>
                <head>
                    <title>About xStatic</title>
                    <meta name="description" content="Static site generator for Umbraco." />
                    <style>body { color: red; }</style>
                    <script>console.log('tracking');</script>
                </head>
                <body>
                    <header>
                        <nav><a href="/">Home</a><a href="/about/">About</a></nav>
                    </header>
                    <aside>Sidebar promo</aside>
                    <main>
                        <h1>About xStatic</h1>
                        <p>xStatic turns <strong>Umbraco</strong> sites into <em>fast</em> static files.</p>
                        <div aria-hidden="true">Hidden decorative text</div>
                    </main>
                    <footer>Copyright 2026</footer>
                </body>
                </html>
                """;

            var markdown = _converter.Convert(html);

            Assert.Contains("# About xStatic", markdown);
            Assert.Contains("xStatic turns **Umbraco** sites into *fast* static files.", markdown);
            Assert.DoesNotContain("Sidebar promo", markdown);
            Assert.DoesNotContain("Copyright 2026", markdown);
            Assert.DoesNotContain("console.log", markdown);
            Assert.DoesNotContain("color: red", markdown);
            Assert.DoesNotContain("Hidden decorative text", markdown);
        }

        [Fact]
        public void Convert_PrependsTitleHeading_WhenMainContentHasNoH1()
        {
            var html = """
                <html>
                <head><title>Getting Started</title></head>
                <body>
                    <main>
                        <h2>Installation</h2>
                        <p>Install the NuGet package.</p>
                    </main>
                </body>
                </html>
                """;

            var markdown = _converter.Convert(html);

            Assert.StartsWith("# Getting Started\n\n## Installation", markdown);
        }

        [Fact]
        public void Convert_RendersListsCodeBlocksLinksImagesBlockquotesAndTables()
        {
            var html = """
                <html>
                <body>
                    <article>
                        <h1>Guide</h1>
                        <p>Read the <a href="https://example.com/docs">documentation</a> and see <img src="/img/arch.png" alt="Architecture" />.</p>
                        <ul>
                            <li>First item</li>
                            <li>Second item
                                <ul>
                                    <li>Nested bullet</li>
                                </ul>
                            </li>
                        </ul>
                        <ol>
                            <li>Step one</li>
                            <li>Step two</li>
                        </ol>
                        <blockquote><p>Static sites are fast &amp; secure.</p></blockquote>
                        <pre><code class="language-csharp">var x = 1;</code></pre>
                        <p>Use <code>dotnet test</code> to verify.</p>
                        <table>
                            <thead><tr><th>Feature</th><th>Status</th></tr></thead>
                            <tbody><tr><td>llms.txt</td><td>Ready</td></tr></tbody>
                        </table>
                        <hr />
                    </article>
                </body>
                </html>
                """;

            var markdown = _converter.Convert(html);

            Assert.Contains("[documentation](https://example.com/docs)", markdown);
            Assert.Contains("![Architecture](/img/arch.png)", markdown);
            Assert.Contains("- First item", markdown);
            Assert.Contains("  - Nested bullet", markdown);
            Assert.Contains("1. Step one", markdown);
            Assert.Contains("2. Step two", markdown);
            Assert.Contains("> Static sites are fast & secure.", markdown);
            Assert.Contains("```csharp\nvar x = 1;\n```", markdown);
            Assert.Contains("`dotnet test`", markdown);
            Assert.Contains("| Feature | Status |", markdown);
            Assert.Contains("| --- | --- |", markdown);
            Assert.Contains("| llms.txt | Ready |", markdown);
            Assert.Contains("---", markdown);
        }

        [Fact]
        public void Convert_RespectsCustomContentSelector()
        {
            var html = """
                <html>
                <body>
                    <div id="banner">Promo banner</div>
                    <div class="doc-body">
                        <h1>Custom Root</h1>
                        <p>Only this section should be converted.</p>
                    </div>
                </body>
                </html>
                """;

            var markdown = _converter.Convert(html, new HtmlToMarkdownOptions
            {
                ContentSelector = ".doc-body"
            });

            Assert.Contains("# Custom Root", markdown);
            Assert.Contains("Only this section should be converted.", markdown);
            Assert.DoesNotContain("Promo banner", markdown);
        }

        [Fact]
        public void ExtractMetadata_ReadsTitleDescriptionCanonicalOgUrlAndJsonLd()
        {
            var html = """
                <html>
                <head>
                    <title>My &amp; Page</title>
                    <meta property="og:description" content="Fallback OG description" />
                    <meta property="og:url" content="https://example.com/my-page/" />
                    <link rel="canonical" href="https://example.com/my-page/" />
                    <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>
                </head>
                <body></body>
                </html>
                """;

            var meta = _converter.ExtractMetadata(html);

            Assert.Equal("My & Page", meta.Title);
            Assert.Equal("Fallback OG description", meta.Description);
            Assert.Equal("https://example.com/my-page/", meta.CanonicalUrl);
            Assert.Equal("https://example.com/my-page/", meta.OgUrl);
            Assert.Single(meta.JsonLdBlocks);
        }

        [Theory]
        [InlineData("index.html", "index.md")]
        [InlineData("about/index.html", "about/index.md")]
        [InlineData("/docs/getting-started/index.html", "docs/getting-started/index.md")]
        [InlineData("blog/post.html", "blog/post.md")]
        [InlineData("blog\\post.htm", "blog/post.md")]
        public void MarkdownPathHelper_GetCompanionMarkdownPath_MapsCorrectly(string htmlPath, string expectedMdPath)
        {
            Assert.Equal(expectedMdPath, MarkdownPathHelper.GetCompanionMarkdownPath(htmlPath));
        }

        [Theory]
        [InlineData("/", null, "/index.md")]
        [InlineData("/about/", null, "/about/index.md")]
        [InlineData("/about", "https://example.com", "https://example.com/about/index.md")]
        [InlineData("https://example.com/docs/intro/", null, "https://example.com/docs/intro/index.md")]
        [InlineData("https://example.com/blog/post.html?ref=1#top", null, "https://example.com/blog/post.md")]
        [InlineData(null, null, "index.md")]
        public void MarkdownPathHelper_GetCompanionMarkdownHref_MapsCorrectly(string? pageUrl, string? hostname, string expectedHref)
        {
            Assert.Equal(expectedHref, MarkdownPathHelper.GetCompanionMarkdownHref(pageUrl, hostname));
        }
    }
}
