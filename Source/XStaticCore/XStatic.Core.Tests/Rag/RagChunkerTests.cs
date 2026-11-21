using System;
using System.Collections.Generic;
using System.Linq;
using XStatic.Core.Rag;
using Xunit;

namespace XStatic.Core.Tests.Rag
{
    public sealed class RagChunkerTests
    {
        private readonly RagChunker _chunker = new RagChunker();

        [Fact]
        public void ChunkDocument_WithSplitOnHeadings_CreatesChunkPerSectionWithMetadata()
        {
            var doc = new RagPageDocument
            {
                Url = "https://example.com/guide/",
                Title = "Guide",
                Description = "A short guide",
                DocType = "docPage",
                Culture = "en-US",
                LastModified = new DateTimeOffset(2026, 5, 1, 0, 0, 0, TimeSpan.Zero),
                Headings = new List<string> { "Intro", "Details" },
                Sections = new List<RagSection>
                {
                    new RagSection
                    {
                        Heading = "Intro",
                        HeadingLevel = 1,
                        HeadingPath = new List<string> { "Intro" },
                        Content = "Introduction content."
                    },
                    new RagSection
                    {
                        Heading = "Details",
                        HeadingLevel = 2,
                        HeadingPath = new List<string> { "Intro", "Details" },
                        Content = "Detailed explanation."
                    }
                },
                CustomProperties = new Dictionary<string, object> { ["tags"] = "rag,static" }
            };

            var chunks = _chunker.ChunkDocument(doc, new RagExportOptions
            {
                SplitOnHeadings = true,
                MaxChunkSize = 500,
                ChunkOverlap = 50
            });

            Assert.Equal(2, chunks.Count);
            Assert.Equal("https://example.com/guide/#chunk-0", chunks[0].Id);
            Assert.Equal("Intro", chunks[0].Heading);
            Assert.Equal(0, chunks[0].ChunkIndex);
            Assert.Equal(2, chunks[0].TotalChunks);
            Assert.Equal("docPage", chunks[0].DocType);
            Assert.Equal("A short guide", chunks[0].Metadata["description"]);
            Assert.Equal("rag,static", chunks[0].Metadata["tags"]);
            Assert.Equal(64, chunks[0].ContentHash.Length);
            Assert.True(chunks[0].EstimatedTokenCount > 0);

            Assert.Equal("https://example.com/guide/#chunk-1", chunks[1].Id);
            Assert.Equal(new[] { "Intro", "Details" }, chunks[1].HeadingPath);
            Assert.Equal(1, chunks[1].ChunkIndex);
            Assert.NotEqual(chunks[0].ContentHash, chunks[1].ContentHash);
        }

        [Fact]
        public void ChunkDocument_SplitsLongSectionRespectingMaxChunkSizeAndOverlap()
        {
            var longText = string.Join(" ", Enumerable.Range(1, 60).Select(i => $"Sentence number {i} explains static RAG indexing."));
            var doc = new RagPageDocument
            {
                Url = "/long/",
                Title = "Long Page",
                Sections = new List<RagSection>
                {
                    new RagSection
                    {
                        Heading = "Overview",
                        HeadingLevel = 1,
                        HeadingPath = new List<string> { "Overview" },
                        Content = longText
                    }
                }
            };

            var chunks = _chunker.ChunkDocument(doc, new RagExportOptions
            {
                SplitOnHeadings = true,
                MaxChunkSize = 200,
                ChunkOverlap = 40
            });

            Assert.True(chunks.Count > 5);
            Assert.All(chunks, c => Assert.True(c.CharacterCount <= 200, $"Chunk exceeded max size: {c.CharacterCount}"));
            Assert.Equal(chunks.Count, chunks[0].TotalChunks);
            // Verify overlap exists between consecutive chunks
            var tailOfFirst = chunks[0].Content.Substring(Math.Max(0, chunks[0].Content.Length - 20));
            Assert.Contains(tailOfFirst.Trim(), chunks[1].Content);
        }

        [Fact]
        public void ChunkDocument_WithSplitOnHeadingsFalse_CombinesSectionsBeforeSplitting()
        {
            var doc = new RagPageDocument
            {
                Url = "/combined/",
                Title = "Combined",
                Headings = new List<string> { "One", "Two" },
                Sections = new List<RagSection>
                {
                    new RagSection { Heading = "One", HeadingLevel = 2, Content = "First section." },
                    new RagSection { Heading = "Two", HeadingLevel = 2, Content = "Second section." }
                }
            };

            var chunks = _chunker.ChunkDocument(doc, new RagExportOptions
            {
                SplitOnHeadings = false,
                MaxChunkSize = 1000
            });

            var single = Assert.Single(chunks);
            Assert.Contains("First section.", single.Content);
            Assert.Contains("Second section.", single.Content);
        }
    }
}
