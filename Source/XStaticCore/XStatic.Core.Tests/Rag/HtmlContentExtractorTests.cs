using System;
using System.Collections.Generic;
using XStatic.Core.Rag;
using Xunit;

namespace XStatic.Core.Tests.Rag
{
    public sealed class HtmlContentExtractorTests
    {
        private readonly HtmlContentExtractor _extractor = new HtmlContentExtractor();

        [Fact]
        public void Extract_ParsesTitleMetaHeadingsAndStripsBoilerplate()
        {
            const string html = """
                <!DOCTYPE html>
                <html lang="en-US">
                <head>
                    <title>Getting Started &amp; Setup</title>
                    <meta name="description" content="Learn how to configure xStatic for static RAG." />
                    <meta property="article:modified_time" content="2026-05-01T12:00:00Z" />
                    <style>body { color: red; }</style>
                </head>
                <body>
                    <nav><a href="/">Home</a><a href="/docs">Docs</a></nav>
                    <main>
                        <!-- ignore this comment -->
                        <h1>Getting Started</h1>
                        <p>Welcome to xStatic.</p>
                        <h2>Installation</h2>
                        <p>Run dotnet add package XStatic.</p>
                        <h3>Prerequisites</h3>
                        <p>Umbraco 17 and .NET 10.</p>
                        <h2>Configuration</h2>
                        <p>Enable the RAG post-generation action.</p>
                        <script>console.log("should be stripped");</script>
                    </main>
                    <footer>Copyright 2026</footer>
                </body>
                </html>
                """;

            var doc = _extractor.Extract(html, "https://example.com/docs/getting-started/", "docs/getting-started/index.html");

            Assert.Equal("Getting Started & Setup", doc.Title);
            Assert.Equal("Learn how to configure xStatic for static RAG.", doc.Description);
            Assert.Equal("en-US", doc.Culture);
            Assert.Equal(new DateTimeOffset(2026, 5, 1, 12, 0, 0, TimeSpan.Zero), doc.LastModified);
            Assert.Equal(new[] { "Getting Started", "Installation", "Prerequisites", "Configuration" }, doc.Headings);

            Assert.Equal(4, doc.Sections.Count);
            Assert.Equal("Getting Started", doc.Sections[0].Heading);
            Assert.Equal(new[] { "Getting Started" }, doc.Sections[0].HeadingPath);
            Assert.Equal("Welcome to xStatic.", doc.Sections[0].Content);

            Assert.Equal("Prerequisites", doc.Sections[2].Heading);
            Assert.Equal(new[] { "Getting Started", "Installation", "Prerequisites" }, doc.Sections[2].HeadingPath);
            Assert.Equal("Umbraco 17 and .NET 10.", doc.Sections[2].Content);

            Assert.Equal("Configuration", doc.Sections[3].Heading);
            Assert.Equal(new[] { "Getting Started", "Configuration" }, doc.Sections[3].HeadingPath);
            Assert.DoesNotContain("should be stripped", doc.Sections[3].Content);
            Assert.DoesNotContain("Copyright 2026", doc.Sections[3].Content);
        }

        [Fact]
        public void Extract_MergesUmbracoMetadataOverHtmlDefaults()
        {
            const string html = "<html><body><article><h1>Hello</h1><p>World</p></article></body></html>";
            var modified = new DateTimeOffset(2026, 6, 15, 8, 30, 0, TimeSpan.Zero);
            var metadata = new RagPageMetadata
            {
                DocType = "blogPost",
                LastModified = modified,
                Culture = "en-GB",
                CustomProperties = new Dictionary<string, object>
                {
                    ["author"] = "Sam",
                    ["category"] = "AI"
                }
            };

            var doc = _extractor.Extract(html, "/blog/hello/", "blog/hello/index.html", metadata);

            Assert.Equal("Hello", doc.Title);
            Assert.Equal("blogPost", doc.DocType);
            Assert.Equal(modified, doc.LastModified);
            Assert.Equal("en-GB", doc.Culture);
            Assert.Equal("Sam", doc.CustomProperties["author"]);
            Assert.Equal("AI", doc.CustomProperties["category"]);
        }
    }
}
