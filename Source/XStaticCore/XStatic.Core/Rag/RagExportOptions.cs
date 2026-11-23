using System;
using System.Collections.Generic;
using System.Linq;

namespace XStatic.Core.Rag
{
    public enum RagExportFormat
    {
        Json,
        Jsonl,
        Markdown
    }

    public class RagExportOptions
    {
        public const int DefaultMaxChunkSize = 1000;
        public const int DefaultChunkOverlap = 150;
        public const string DefaultJsonPath = "rag-chunks.json";
        public const string DefaultJsonlPath = "rag-chunks.jsonl";
        public const string DefaultMarkdownFolder = "rag-chunks";
        public const string DefaultWebMcpIndexPath = "webmcp-index.json";

        public RagExportFormat OutputFormat { get; set; } = RagExportFormat.Jsonl;

        public string OutputPath { get; set; }

        public int MaxChunkSize { get; set; } = DefaultMaxChunkSize;

        public int ChunkOverlap { get; set; } = DefaultChunkOverlap;

        public bool SplitOnHeadings { get; set; } = true;

        public IList<string> ExcludedPaths { get; set; } = new List<string>();

        public IList<string> ExcludedDocTypes { get; set; } = new List<string>();

        public IList<string> CustomPropertyAliases { get; set; } = new List<string>();

        public bool GenerateWebMcpIndex { get; set; } = true;

        public string WebMcpIndexPath { get; set; } = DefaultWebMcpIndexPath;

        public string BaseUrl { get; set; } = string.Empty;

        public string SiteName { get; set; } = string.Empty;

        public string GetEffectiveOutputPath()
        {
            if (!string.IsNullOrWhiteSpace(OutputPath))
            {
                return OutputPath.Trim();
            }

            return OutputFormat switch
            {
                RagExportFormat.Json => DefaultJsonPath,
                RagExportFormat.Markdown => DefaultMarkdownFolder,
                _ => DefaultJsonlPath
            };
        }

        public string GetEffectiveWebMcpIndexPath()
        {
            return string.IsNullOrWhiteSpace(WebMcpIndexPath)
                ? DefaultWebMcpIndexPath
                : WebMcpIndexPath.Trim();
        }

        public static RagExportOptions FromParameters(IDictionary<string, string> parameters, string defaultBaseUrl = null, string siteName = null)
        {
            var options = new RagExportOptions
            {
                BaseUrl = defaultBaseUrl?.Trim() ?? string.Empty,
                SiteName = siteName?.Trim() ?? string.Empty
            };

            if (parameters == null)
            {
                return options;
            }

            if (TryGetString(parameters, RagExportFields.OutputFormat, out var formatValue) &&
                Enum.TryParse<RagExportFormat>(formatValue, ignoreCase: true, out var parsedFormat))
            {
                options.OutputFormat = parsedFormat;
            }

            if (TryGetString(parameters, RagExportFields.OutputPath, out var outputPath))
            {
                options.OutputPath = outputPath;
            }

            if (TryGetInt(parameters, RagExportFields.MaxChunkSize, out var maxChunkSize) && maxChunkSize > 0)
            {
                options.MaxChunkSize = maxChunkSize;
            }

            if (TryGetInt(parameters, RagExportFields.ChunkOverlap, out var chunkOverlap) && chunkOverlap >= 0)
            {
                options.ChunkOverlap = chunkOverlap;
            }

            if (TryGetBool(parameters, RagExportFields.SplitOnHeadings, out var splitOnHeadings))
            {
                options.SplitOnHeadings = splitOnHeadings;
            }

            if (TryGetString(parameters, RagExportFields.ExcludedPaths, out var excludedPaths))
            {
                options.ExcludedPaths = SplitCsv(excludedPaths);
            }

            if (TryGetString(parameters, RagExportFields.ExcludedDocTypes, out var excludedDocTypes))
            {
                options.ExcludedDocTypes = SplitCsv(excludedDocTypes);
            }

            if (TryGetString(parameters, RagExportFields.CustomPropertyAliases, out var customProps))
            {
                options.CustomPropertyAliases = SplitCsv(customProps);
            }

            if (TryGetBool(parameters, RagExportFields.GenerateWebMcpIndex, out var generateIndex))
            {
                options.GenerateWebMcpIndex = generateIndex;
            }

            if (TryGetString(parameters, RagExportFields.WebMcpIndexPath, out var indexPath))
            {
                options.WebMcpIndexPath = indexPath;
            }

            return options;
        }

        private static bool TryGetString(IDictionary<string, string> parameters, string key, out string value)
        {
            if (parameters.TryGetValue(key, out value) && !string.IsNullOrWhiteSpace(value))
            {
                value = value.Trim();
                return true;
            }

            value = null;
            return false;
        }

        private static bool TryGetInt(IDictionary<string, string> parameters, string key, out int value)
        {
            value = 0;
            return TryGetString(parameters, key, out var raw) && int.TryParse(raw, out value);
        }

        private static bool TryGetBool(IDictionary<string, string> parameters, string key, out bool value)
        {
            value = false;
            if (!TryGetString(parameters, key, out var raw))
            {
                return false;
            }

            if (bool.TryParse(raw, out value))
            {
                return true;
            }

            if (raw == "1")
            {
                value = true;
                return true;
            }

            if (raw == "0")
            {
                value = false;
                return true;
            }

            return false;
        }

        private static List<string> SplitCsv(string raw)
        {
            return raw
                .Split(new[] { ',', ';', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(x => x.Trim())
                .Where(x => !string.IsNullOrEmpty(x))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }
    }

    public static class RagExportFields
    {
        public const string OutputFormat = "OutputFormat";
        public const string OutputPath = "OutputPath";
        public const string MaxChunkSize = "MaxChunkSize";
        public const string ChunkOverlap = "ChunkOverlap";
        public const string SplitOnHeadings = "SplitOnHeadings";
        public const string ExcludedPaths = "ExcludedPaths";
        public const string ExcludedDocTypes = "ExcludedDocTypes";
        public const string CustomPropertyAliases = "CustomPropertyAliases";
        public const string GenerateWebMcpIndex = "GenerateWebMcpIndex";
        public const string WebMcpIndexPath = "WebMcpIndexPath";
    }
}
