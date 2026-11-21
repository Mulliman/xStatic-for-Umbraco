using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;

namespace XStatic.Core.Rag
{
    public interface IRagChunker
    {
        IReadOnlyList<RagChunk> ChunkDocument(RagPageDocument document, RagExportOptions options);
    }

    public class RagChunker : IRagChunker
    {
        public IReadOnlyList<RagChunk> ChunkDocument(RagPageDocument document, RagExportOptions options)
        {
            if (document == null)
            {
                throw new ArgumentNullException(nameof(document));
            }

            options ??= new RagExportOptions();
            var maxChunkSize = Math.Max(1, options.MaxChunkSize);
            var chunkOverlap = Math.Clamp(options.ChunkOverlap, 0, Math.Max(0, maxChunkSize - 1));

            var rawSegments = new List<(string Heading, IList<string> HeadingPath, string Content)>();

            if (options.SplitOnHeadings)
            {
                foreach (var section in document.Sections ?? Enumerable.Empty<RagSection>())
                {
                    if (string.IsNullOrWhiteSpace(section?.Content))
                    {
                        continue;
                    }

                    var headingPath = section.HeadingPath != null
                        ? new List<string>(section.HeadingPath)
                        : new List<string>();

                    foreach (var piece in SplitText(section.Content.Trim(), maxChunkSize, chunkOverlap))
                    {
                        rawSegments.Add((section.Heading, headingPath, piece));
                    }
                }
            }
            else
            {
                var combinedBuilder = new StringBuilder();
                foreach (var section in document.Sections ?? Enumerable.Empty<RagSection>())
                {
                    if (string.IsNullOrWhiteSpace(section?.Content))
                    {
                        continue;
                    }

                    if (combinedBuilder.Length > 0)
                    {
                        combinedBuilder.Append("\n\n");
                    }

                    if (!string.IsNullOrWhiteSpace(section.Heading))
                    {
                        combinedBuilder.Append(section.Heading).Append("\n\n");
                    }

                    combinedBuilder.Append(section.Content.Trim());
                }

                var combined = combinedBuilder.ToString().Trim();
                if (!string.IsNullOrEmpty(combined))
                {
                    var allHeadings = document.Headings != null
                        ? new List<string>(document.Headings)
                        : new List<string>();
                    var primaryHeading = allHeadings.FirstOrDefault();

                    foreach (var piece in SplitText(combined, maxChunkSize, chunkOverlap))
                    {
                        rawSegments.Add((primaryHeading, new List<string>(), piece));
                    }
                }
            }

            var totalChunks = rawSegments.Count;
            var chunks = new List<RagChunk>(totalChunks);
            var normalizedIdPrefix = NormalizeUrlForId(document.Url);

            for (var i = 0; i < totalChunks; i++)
            {
                var segment = rawSegments[i];
                var metadata = BuildChunkMetadata(document);

                chunks.Add(new RagChunk
                {
                    Id = $"{normalizedIdPrefix}#chunk-{i}",
                    Url = document.Url,
                    Title = document.Title,
                    Heading = segment.Heading,
                    HeadingPath = segment.HeadingPath,
                    ChunkIndex = i,
                    TotalChunks = totalChunks,
                    Content = segment.Content,
                    CharacterCount = segment.Content.Length,
                    EstimatedTokenCount = EstimateTokens(segment.Content),
                    ContentHash = ComputeSha256(segment.Content),
                    DocType = document.DocType,
                    LastModified = document.LastModified,
                    Culture = document.Culture,
                    Metadata = metadata
                });
            }

            return chunks;
        }

        internal static List<string> SplitText(string text, int maxChunkSize, int overlap)
        {
            var results = new List<string>();
            if (string.IsNullOrWhiteSpace(text))
            {
                return results;
            }

            if (text.Length <= maxChunkSize)
            {
                results.Add(text);
                return results;
            }

            var start = 0;
            while (start < text.Length)
            {
                var remaining = text.Length - start;
                if (remaining <= maxChunkSize)
                {
                    var tail = text.Substring(start).Trim();
                    if (!string.IsNullOrEmpty(tail))
                    {
                        results.Add(tail);
                    }

                    break;
                }

                var end = FindSplitIndex(text, start, maxChunkSize);
                var slice = text.Substring(start, end - start).Trim();
                if (!string.IsNullOrEmpty(slice))
                {
                    results.Add(slice);
                }

                if (end >= text.Length)
                {
                    break;
                }

                var nextStart = end - overlap;
                if (nextStart <= start)
                {
                    nextStart = end;
                }

                // Skip leading whitespace for the next chunk
                while (nextStart < text.Length && char.IsWhiteSpace(text[nextStart]))
                {
                    nextStart++;
                }

                start = nextStart;
            }

            return results;
        }

        private static int FindSplitIndex(string text, int start, int maxChunkSize)
        {
            var maxEnd = Math.Min(text.Length, start + maxChunkSize);
            var minPreferred = start + (maxChunkSize / 2);

            // 1. Prefer paragraph boundary
            var paragraphBreak = text.LastIndexOf("\n\n", maxEnd - 1, maxEnd - start, StringComparison.Ordinal);
            if (paragraphBreak >= minPreferred)
            {
                return paragraphBreak + 2;
            }

            // 2. Prefer single newline
            var lineBreak = text.LastIndexOf('\n', maxEnd - 1, maxEnd - start);
            if (lineBreak >= minPreferred)
            {
                return lineBreak + 1;
            }

            // 3. Prefer sentence boundary
            for (var i = maxEnd - 1; i >= minPreferred; i--)
            {
                var c = text[i];
                if ((c == '.' || c == '!' || c == '?') && i + 1 < text.Length && char.IsWhiteSpace(text[i + 1]))
                {
                    return i + 1;
                }
            }

            // 4. Prefer word boundary
            var spaceBreak = text.LastIndexOf(' ', maxEnd - 1, maxEnd - start);
            if (spaceBreak > start)
            {
                return spaceBreak + 1;
            }

            // 5. Hard character split
            return maxEnd;
        }

        private static Dictionary<string, object> BuildChunkMetadata(RagPageDocument document)
        {
            var metadata = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);

            if (!string.IsNullOrWhiteSpace(document.Description))
            {
                metadata["description"] = document.Description;
            }

            if (document.CustomProperties != null)
            {
                foreach (var kvp in document.CustomProperties)
                {
                    if (!string.IsNullOrWhiteSpace(kvp.Key) && kvp.Value != null)
                    {
                        metadata[kvp.Key] = kvp.Value;
                    }
                }
            }

            return metadata;
        }

        private static int EstimateTokens(string text)
        {
            if (string.IsNullOrEmpty(text))
            {
                return 0;
            }

            return Math.Max(1, (int)Math.Ceiling(text.Length / 4.0));
        }

        private static string ComputeSha256(string text)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(text ?? string.Empty));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }

        private static string NormalizeUrlForId(string url)
        {
            if (string.IsNullOrWhiteSpace(url))
            {
                return "/";
            }

            return url.Trim();
        }
    }
}
