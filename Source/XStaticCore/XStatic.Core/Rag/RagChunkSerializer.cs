using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace XStatic.Core.Rag
{
    public interface IRagChunkSerializer
    {
        string SerializeJson(IEnumerable<RagChunk> chunks, RagExportOptions options, DateTimeOffset generatedAt);

        string SerializeJsonl(IEnumerable<RagChunk> chunks);

        string SerializeMarkdown(RagChunk chunk);

        string GetMarkdownChunkRelativePath(RagChunk chunk, string folderPath);
    }

    public class RagChunkSerializer : IRagChunkSerializer
    {
        private static readonly JsonSerializerOptions IndentedJsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            WriteIndented = true
        };

        private static readonly JsonSerializerOptions CompactJsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            WriteIndented = false
        };

        private static readonly Regex NonSlugCharsRegex = new Regex(@"[^a-z0-9\-]+", RegexOptions.Compiled);

        public string SerializeJson(IEnumerable<RagChunk> chunks, RagExportOptions options, DateTimeOffset generatedAt)
        {
            var chunkList = (chunks ?? Enumerable.Empty<RagChunk>()).ToList();

            var envelope = new RagExportEnvelope
            {
                SchemaVersion = "1.0",
                GeneratedAt = generatedAt,
                SiteName = string.IsNullOrWhiteSpace(options?.SiteName) ? null : options.SiteName,
                BaseUrl = string.IsNullOrWhiteSpace(options?.BaseUrl) ? null : options.BaseUrl,
                TotalChunks = chunkList.Count,
                Chunks = chunkList
            };

            return JsonSerializer.Serialize(envelope, IndentedJsonOptions);
        }

        public string SerializeJsonl(IEnumerable<RagChunk> chunks)
        {
            var sb = new StringBuilder();
            var first = true;

            foreach (var chunk in chunks ?? Enumerable.Empty<RagChunk>())
            {
                if (!first)
                {
                    sb.Append('\n');
                }

                sb.Append(JsonSerializer.Serialize(chunk, CompactJsonOptions));
                first = false;
            }

            return sb.ToString();
        }

        public string SerializeMarkdown(RagChunk chunk)
        {
            if (chunk == null)
            {
                throw new ArgumentNullException(nameof(chunk));
            }

            var sb = new StringBuilder();
            sb.AppendLine("---");
            AppendYamlField(sb, "id", chunk.Id);
            AppendYamlField(sb, "url", chunk.Url);
            AppendYamlField(sb, "title", chunk.Title);

            if (!string.IsNullOrWhiteSpace(chunk.Heading))
            {
                AppendYamlField(sb, "heading", chunk.Heading);
            }

            if (chunk.HeadingPath != null && chunk.HeadingPath.Count > 0)
            {
                sb.AppendLine("heading_path:");
                foreach (var heading in chunk.HeadingPath)
                {
                    sb.Append("  - ").AppendLine(EscapeYamlString(heading));
                }
            }

            sb.AppendLine($"chunk_index: {chunk.ChunkIndex}");
            sb.AppendLine($"total_chunks: {chunk.TotalChunks}");
            sb.AppendLine($"estimated_tokens: {chunk.EstimatedTokenCount}");

            if (!string.IsNullOrWhiteSpace(chunk.DocType))
            {
                AppendYamlField(sb, "doc_type", chunk.DocType);
            }

            if (!string.IsNullOrWhiteSpace(chunk.Culture))
            {
                AppendYamlField(sb, "culture", chunk.Culture);
            }

            if (chunk.LastModified.HasValue)
            {
                AppendYamlField(sb, "last_modified", chunk.LastModified.Value.ToString("O"));
            }

            AppendYamlField(sb, "content_hash", chunk.ContentHash);
            sb.AppendLine("---");
            sb.AppendLine();

            if (!string.IsNullOrWhiteSpace(chunk.Title))
            {
                sb.Append("# ").AppendLine(chunk.Title);
                sb.AppendLine();
            }

            if (!string.IsNullOrWhiteSpace(chunk.Heading) &&
                !string.Equals(chunk.Heading, chunk.Title, StringComparison.OrdinalIgnoreCase))
            {
                sb.Append("## ").AppendLine(chunk.Heading);
                sb.AppendLine();
            }

            sb.Append(chunk.Content);
            return sb.ToString();
        }

        public string GetMarkdownChunkRelativePath(RagChunk chunk, string folderPath)
        {
            if (chunk == null)
            {
                throw new ArgumentNullException(nameof(chunk));
            }

            var folder = string.IsNullOrWhiteSpace(folderPath)
                ? RagExportOptions.DefaultMarkdownFolder
                : folderPath.Trim().Trim('/', '\\');

            var slugSource = chunk.Url ?? string.Empty;
            if (Uri.TryCreate(slugSource, UriKind.Absolute, out var uri))
            {
                slugSource = uri.AbsolutePath;
            }

            var slug = slugSource.Trim('/').Replace('/', '-').ToLowerInvariant();
            slug = NonSlugCharsRegex.Replace(slug, "-").Trim('-');
            if (string.IsNullOrEmpty(slug))
            {
                slug = "index";
            }

            return $"{folder}/{slug}-chunk-{chunk.ChunkIndex:D4}.md";
        }

        private static void AppendYamlField(StringBuilder sb, string key, string value)
        {
            sb.Append(key).Append(": ").AppendLine(EscapeYamlString(value ?? string.Empty));
        }

        private static string EscapeYamlString(string value)
        {
            var escaped = (value ?? string.Empty)
                .Replace("\\", "\\\\")
                .Replace("\"", "\\\"")
                .Replace("\r", string.Empty)
                .Replace("\n", "\\n");
            return $"\"{escaped}\"";
        }
    }
}
