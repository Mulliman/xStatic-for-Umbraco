using System;
using System.Collections.Generic;

namespace XStatic.Core.Rag
{
    public class WebMcpIndex
    {
        public string SchemaVersion { get; set; } = "1.0";

        public DateTimeOffset GeneratedAt { get; set; }

        public string SiteName { get; set; }

        public string BaseUrl { get; set; }

        public string ChunksPath { get; set; }

        public string ChunksFormat { get; set; }

        public int TotalPages { get; set; }

        public int TotalChunks { get; set; }

        public IList<WebMcpToolDefinition> Tools { get; set; } = new List<WebMcpToolDefinition>();

        public IList<WebMcpPageEntry> Pages { get; set; } = new List<WebMcpPageEntry>();
    }

    public class WebMcpToolDefinition
    {
        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public bool ReadOnly { get; set; } = true;

        public Dictionary<string, WebMcpToolParameter> Parameters { get; set; } = new Dictionary<string, WebMcpToolParameter>(StringComparer.OrdinalIgnoreCase);
    }

    public class WebMcpToolParameter
    {
        public string Type { get; set; } = "string";

        public string Description { get; set; } = string.Empty;

        public bool Required { get; set; }
    }

    public class WebMcpPageEntry
    {
        public string Url { get; set; } = string.Empty;

        public string Title { get; set; } = string.Empty;

        public string Description { get; set; }

        public string Summary { get; set; }

        public string DocType { get; set; }

        public string Culture { get; set; }

        public DateTimeOffset? LastModified { get; set; }

        public IList<string> Headings { get; set; } = new List<string>();

        public IList<string> Keywords { get; set; } = new List<string>();

        public IList<string> ChunkIds { get; set; } = new List<string>();

        public int ChunkCount { get; set; }
    }
}
