using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using XStatic.Core.Rag;
using Xunit;

namespace XStatic.Core.Tests.Rag
{
    public sealed class RagSerializationAndWebMcpTests
    {
        private readonly RagChunkSerializer _serializer = new RagChunkSerializer();
        private readonly WebMcpIndexBuilder _indexBuilder = new WebMcpIndexBuilder();

        [Fact]
        public void SerializeJson_AndJsonl_ProduceValidDeserializablePayloads()
        {
            var generatedAt = new DateTimeOffset(2026, 5, 10, 14, 0, 0, TimeSpan.Zero);
            var options = new RagExportOptions
            {
                SiteName = "Docs Site",
                BaseUrl = "https://docs.example.com",
                OutputFormat = RagExportFormat.Jsonl
            };

            var chunks = new List<RagChunk>
            {
                new RagChunk
                {
                    Id = "https://docs.example.com/#chunk-0",
                    Url = "https://docs.example.com/",
                    Title = "Home",
                    Heading = "Welcome",
                    HeadingPath = new List<string> { "Welcome" },
                    ChunkIndex = 0,
                    TotalChunks = 1,
                    Content = "Hello static world.",
                    CharacterCount = 19,
                    EstimatedTokenCount = 5,
                    ContentHash = "abc123"
                },
                new RagChunk
                {
                    Id = "https://docs.example.com/about/#chunk-0",
                    Url = "https://docs.example.com/about/",
                    Title = "About",
                    Heading = "Team",
                    HeadingPath = new List<string> { "Team" },
                    ChunkIndex = 0,
                    TotalChunks = 1,
                    Content = "About our team.",
                    CharacterCount = 15,
                    EstimatedTokenCount = 4,
                    ContentHash = "def456"
                }
            };

            var json = _serializer.SerializeJson(chunks, options, generatedAt);
            using (var doc = JsonDocument.Parse(json))
            {
                Assert.Equal("1.0", doc.RootElement.GetProperty("schemaVersion").GetString());
                Assert.Equal("Docs Site", doc.RootElement.GetProperty("siteName").GetString());
                Assert.Equal(2, doc.RootElement.GetProperty("totalChunks").GetInt32());
                Assert.Equal(2, doc.RootElement.GetProperty("chunks").GetArrayLength());
            }

            var jsonl = _serializer.SerializeJsonl(chunks);
            var lines = jsonl.Split('\n');
            Assert.Equal(2, lines.Length);
            using (var line0 = JsonDocument.Parse(lines[0]))
            {
                Assert.Equal("https://docs.example.com/#chunk-0", line0.RootElement.GetProperty("id").GetString());
            }
        }

        [Fact]
        public void SerializeMarkdown_IncludesFrontmatterAndSlugPath()
        {
            var chunk = new RagChunk
            {
                Id = "https://docs.example.com/guides/rag/#chunk-2",
                Url = "https://docs.example.com/guides/rag/",
                Title = "RAG Guide",
                Heading = "Chunking",
                HeadingPath = new List<string> { "RAG Guide", "Chunking" },
                ChunkIndex = 2,
                TotalChunks = 4,
                EstimatedTokenCount = 42,
                DocType = "guidePage",
                ContentHash = "deadbeef",
                Content = "Split content cleanly on headings."
            };

            var markdown = _serializer.SerializeMarkdown(chunk);
            var relativePath = _serializer.GetMarkdownChunkRelativePath(chunk, "rag-chunks");

            Assert.StartsWith("---", markdown);
            Assert.Contains("title: \"RAG Guide\"", markdown);
            Assert.Contains("heading: \"Chunking\"", markdown);
            Assert.Contains("doc_type: \"guidePage\"", markdown);
            Assert.Contains("## Chunking", markdown);
            Assert.Contains("Split content cleanly on headings.", markdown);
            Assert.Matches(@"^rag-chunks/guides-rag-[0-9a-f]{8}-chunk-0002\.md$", relativePath);
        }

        [Fact]
        public void GetMarkdownChunkRelativePath_AvoidsCollisionsAcrossPathsAndUnicodeUrls()
        {
            var pathA = _serializer.GetMarkdownChunkRelativePath(new RagChunk { Url = "https://example.com/about-us/", ChunkIndex = 0 }, "rag-chunks");
            var pathB = _serializer.GetMarkdownChunkRelativePath(new RagChunk { Url = "https://example.com/about/us/", ChunkIndex = 0 }, "rag-chunks");
            var pathHome = _serializer.GetMarkdownChunkRelativePath(new RagChunk { Url = "https://example.com/", ChunkIndex = 0 }, "rag-chunks");
            var pathJapanese = _serializer.GetMarkdownChunkRelativePath(new RagChunk { Url = "https://example.com/日本/", ChunkIndex = 0 }, "rag-chunks");

            Assert.NotEqual(pathA, pathB);
            Assert.NotEqual(pathHome, pathJapanese);
        }

        [Fact]
        public void WebMcpIndexBuilder_BuildsAndSerializesValidIndexWithJsonSchemaToolsAndSubpath()
        {
            var generatedAt = new DateTimeOffset(2026, 5, 10, 14, 0, 0, TimeSpan.Zero);
            var options = new RagExportOptions
            {
                SiteName = "xStatic Docs",
                BaseUrl = "https://xstatic.dev/docs",
                OutputFormat = RagExportFormat.Markdown,
                OutputPath = "rag-chunks"
            };

            var pages = new List<RagPageDocument>
            {
                new RagPageDocument
                {
                    Url = "https://xstatic.dev/docs/rag/",
                    Title = "Static RAG Pipeline Übersicht",
                    Description = "Export Umbraco content into structured chunks for AI search.",
                    DocType = "docPage",
                    Headings = new List<string> { "Static RAG Pipeline", "WebMCP Index" }
                }
            };

            var chunks = new List<RagChunk>
            {
                new RagChunk
                {
                    Id = "https://xstatic.dev/docs/rag/#chunk-0",
                    Url = "https://xstatic.dev/docs/rag/",
                    Title = "Static RAG Pipeline",
                    Content = "Export Umbraco content into structured chunks."
                }
            };

            var chunkPaths = new Dictionary<string, string>
            {
                ["https://xstatic.dev/docs/rag/#chunk-0"] = "rag-chunks/docs-rag-12345678-chunk-0000.md"
            };

            var index = _indexBuilder.Build(pages, chunks, options, generatedAt, chunkPaths);
            var json = _indexBuilder.Serialize(index);

            Assert.Equal("1.0", index.SchemaVersion);
            Assert.Equal("/docs/rag-chunks", index.ChunksPath);
            Assert.Equal("markdown", index.ChunksFormat);
            Assert.Equal(1, index.TotalPages);
            Assert.Equal(1, index.TotalChunks);
            Assert.Equal(2, index.Tools.Count);
            Assert.All(index.Tools, t =>
            {
                Assert.True(t.ReadOnly);
                Assert.Equal("object", t.InputSchema.Type);
                Assert.NotEmpty(t.InputSchema.Properties);
                Assert.NotEmpty(t.InputSchema.Required);
            });

            var pageEntry = Assert.Single(index.Pages);
            Assert.Equal(new[] { "https://xstatic.dev/docs/rag/#chunk-0" }, pageEntry.ChunkIds);
            Assert.Equal(new[] { "/docs/rag-chunks/docs-rag-12345678-chunk-0000.md" }, pageEntry.ChunkFiles);
            Assert.Contains("static", pageEntry.Keywords);
            Assert.Contains("webmcp", pageEntry.Keywords);
            Assert.Contains("übersicht", pageEntry.Keywords);

            using var parsed = JsonDocument.Parse(json);
            Assert.Equal("xStatic Docs", parsed.RootElement.GetProperty("siteName").GetString());
            var tools = parsed.RootElement.GetProperty("tools");
            Assert.Equal(2, tools.GetArrayLength());
            Assert.Equal("object", tools[0].GetProperty("inputSchema").GetProperty("type").GetString());
            Assert.Equal(1, parsed.RootElement.GetProperty("pages").GetArrayLength());
        }
    }
}
