using System;
using System.Collections.Generic;

namespace XStatic.Core.Rag
{
    public class RagPageMetadata
    {
        public string DocType { get; set; }

        public DateTimeOffset? LastModified { get; set; }

        public string Culture { get; set; }

        public Dictionary<string, object> CustomProperties { get; set; } = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
    }

    public class RagSection
    {
        public string Heading { get; set; }

        public int HeadingLevel { get; set; }

        public IList<string> HeadingPath { get; set; } = new List<string>();

        public string Content { get; set; } = string.Empty;
    }

    public class RagPageDocument
    {
        public string Url { get; set; } = string.Empty;

        public string RelativePath { get; set; } = string.Empty;

        public string Title { get; set; } = string.Empty;

        public string Description { get; set; }

        public string DocType { get; set; }

        public DateTimeOffset? LastModified { get; set; }

        public string Culture { get; set; }

        public IList<string> Headings { get; set; } = new List<string>();

        public IList<RagSection> Sections { get; set; } = new List<RagSection>();

        public Dictionary<string, object> CustomProperties { get; set; } = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
    }

    public class RagChunk
    {
        public string Id { get; set; } = string.Empty;

        public string Url { get; set; } = string.Empty;

        public string Title { get; set; } = string.Empty;

        public string Heading { get; set; }

        public IList<string> HeadingPath { get; set; } = new List<string>();

        public int ChunkIndex { get; set; }

        public int TotalChunks { get; set; }

        public string Content { get; set; } = string.Empty;

        public int CharacterCount { get; set; }

        public int EstimatedTokenCount { get; set; }

        public string ContentHash { get; set; } = string.Empty;

        public string DocType { get; set; }

        public DateTimeOffset? LastModified { get; set; }

        public string Culture { get; set; }

        public Dictionary<string, object> Metadata { get; set; } = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
    }

    public class RagExportEnvelope
    {
        public string SchemaVersion { get; set; } = "1.0";

        public DateTimeOffset GeneratedAt { get; set; }

        public string SiteName { get; set; }

        public string BaseUrl { get; set; }

        public int TotalChunks { get; set; }

        public IReadOnlyList<RagChunk> Chunks { get; set; } = Array.Empty<RagChunk>();
    }

    public class RagExportResult
    {
        public int StaticSiteId { get; set; }

        public DateTimeOffset GeneratedAt { get; set; }

        public IReadOnlyList<RagPageDocument> Pages { get; set; } = Array.Empty<RagPageDocument>();

        public IReadOnlyList<RagChunk> Chunks { get; set; } = Array.Empty<RagChunk>();

        public IReadOnlyList<string> WrittenFiles { get; set; } = Array.Empty<string>();

        public WebMcpIndex WebMcpIndex { get; set; }

        public IReadOnlyList<VectorStorePushResult> VectorStoreResults { get; set; } = Array.Empty<VectorStorePushResult>();
    }
}
