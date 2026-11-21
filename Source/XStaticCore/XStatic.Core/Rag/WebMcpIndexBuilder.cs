using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace XStatic.Core.Rag
{
    public interface IWebMcpIndexBuilder
    {
        WebMcpIndex Build(
            IEnumerable<RagPageDocument> pages,
            IEnumerable<RagChunk> chunks,
            RagExportOptions options,
            DateTimeOffset generatedAt,
            IReadOnlyDictionary<string, string> chunkRelativePaths = null);

        string Serialize(WebMcpIndex index);
    }

    public class WebMcpIndexBuilder : IWebMcpIndexBuilder
    {
        private const int MaxSummaryLength = 240;
        private const int MaxKeywordsPerPage = 12;

        private static readonly JsonSerializerOptions SerializerOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            WriteIndented = true
        };

        private static readonly Regex WordRegex = new Regex(@"[\p{L}\p{Nd}]{3,}", RegexOptions.Compiled);

        private static readonly HashSet<string> StopWords = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "the", "and", "for", "with", "that", "this", "from", "are", "was", "were", "will",
            "have", "has", "had", "not", "but", "you", "your", "our", "all", "can", "into",
            "more", "about", "how", "what", "when", "where", "which", "who", "why", "use", "using"
        };

        public WebMcpIndex Build(
            IEnumerable<RagPageDocument> pages,
            IEnumerable<RagChunk> chunks,
            RagExportOptions options,
            DateTimeOffset generatedAt,
            IReadOnlyDictionary<string, string> chunkRelativePaths = null)
        {
            options ??= new RagExportOptions();
            var pageList = (pages ?? Enumerable.Empty<RagPageDocument>()).ToList();
            var chunkList = (chunks ?? Enumerable.Empty<RagChunk>()).ToList();
            var normalizedBaseUrl = RagExportService.NormalizeBaseUrl(options.BaseUrl);
            var basePathPrefix = GetBasePathPrefix(normalizedBaseUrl);

            var chunksByUrl = chunkList
                .GroupBy(c => c.Url ?? string.Empty, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.ToList(), StringComparer.OrdinalIgnoreCase);

            var entries = new List<WebMcpPageEntry>(pageList.Count);
            foreach (var page in pageList)
            {
                chunksByUrl.TryGetValue(page.Url ?? string.Empty, out var pageChunks);
                pageChunks ??= new List<RagChunk>();

                var summary = BuildSummary(page, pageChunks);
                var keywords = ExtractKeywords(page);

                IList<string> chunkFiles = null;
                if (chunkRelativePaths != null && chunkRelativePaths.Count > 0 && pageChunks.Count > 0)
                {
                    var files = new List<string>();
                    foreach (var chunk in pageChunks)
                    {
                        if (chunkRelativePaths.TryGetValue(chunk.Id, out var relPath) && !string.IsNullOrWhiteSpace(relPath))
                        {
                            files.Add(PrependBasePath(basePathPrefix, relPath));
                        }
                    }

                    if (files.Count > 0)
                    {
                        chunkFiles = files;
                    }
                }

                entries.Add(new WebMcpPageEntry
                {
                    Url = page.Url,
                    Title = page.Title,
                    Description = page.Description,
                    Summary = summary,
                    DocType = page.DocType,
                    Culture = page.Culture,
                    LastModified = page.LastModified,
                    Headings = page.Headings != null ? new List<string>(page.Headings) : new List<string>(),
                    Keywords = keywords,
                    ChunkIds = pageChunks.Select(c => c.Id).ToList(),
                    ChunkFiles = chunkFiles,
                    ChunkCount = pageChunks.Count
                });
            }

            var outputPath = options.GetEffectiveOutputPath().TrimStart('/', '\\');

            return new WebMcpIndex
            {
                SchemaVersion = "1.0",
                GeneratedAt = generatedAt,
                SiteName = string.IsNullOrWhiteSpace(options.SiteName) ? null : options.SiteName,
                BaseUrl = string.IsNullOrWhiteSpace(normalizedBaseUrl) ? null : normalizedBaseUrl,
                ChunksPath = PrependBasePath(basePathPrefix, outputPath),
                ChunksFormat = options.OutputFormat.ToString().ToLowerInvariant(),
                TotalPages = entries.Count,
                TotalChunks = chunkList.Count,
                Tools = BuildDefaultTools(),
                Pages = entries
            };
        }

        public string Serialize(WebMcpIndex index)
        {
            if (index == null)
            {
                throw new ArgumentNullException(nameof(index));
            }

            return JsonSerializer.Serialize(index, SerializerOptions);
        }

        private static List<WebMcpToolDefinition> BuildDefaultTools()
        {
            return new List<WebMcpToolDefinition>
            {
                new WebMcpToolDefinition
                {
                    Name = "search_site_content",
                    Description = "Search static site pages by query terms against titles, headings, keywords, and summaries.",
                    ReadOnly = true,
                    InputSchema = new WebMcpToolInputSchema
                    {
                        Type = "object",
                        Properties = new Dictionary<string, WebMcpToolProperty>(StringComparer.OrdinalIgnoreCase)
                        {
                            ["query"] = new WebMcpToolProperty
                            {
                                Type = "string",
                                Description = "Search query string."
                            },
                            ["limit"] = new WebMcpToolProperty
                            {
                                Type = "integer",
                                Description = "Maximum number of matching pages to return."
                            }
                        },
                        Required = new List<string> { "query" }
                    }
                },
                new WebMcpToolDefinition
                {
                    Name = "get_page_chunks",
                    Description = "Retrieve structured RAG text chunks for a specific page URL from the exported chunks artifact or per-chunk files.",
                    ReadOnly = true,
                    InputSchema = new WebMcpToolInputSchema
                    {
                        Type = "object",
                        Properties = new Dictionary<string, WebMcpToolProperty>(StringComparer.OrdinalIgnoreCase)
                        {
                            ["url"] = new WebMcpToolProperty
                            {
                                Type = "string",
                                Description = "Canonical or relative page URL from the index."
                            }
                        },
                        Required = new List<string> { "url" }
                    }
                }
            };
        }

        private static string GetBasePathPrefix(string normalizedBaseUrl)
        {
            if (string.IsNullOrWhiteSpace(normalizedBaseUrl) ||
                !Uri.TryCreate(normalizedBaseUrl, UriKind.Absolute, out var uri))
            {
                return string.Empty;
            }

            var path = uri.AbsolutePath.TrimEnd('/');
            return path == "/" ? string.Empty : path;
        }

        private static string PrependBasePath(string basePathPrefix, string relativePath)
        {
            var normalizedRel = "/" + (relativePath ?? string.Empty).Replace('\\', '/').TrimStart('/');
            if (string.IsNullOrEmpty(basePathPrefix))
            {
                return normalizedRel;
            }

            return basePathPrefix + normalizedRel;
        }

        private static string BuildSummary(RagPageDocument page, List<RagChunk> pageChunks)
        {
            if (!string.IsNullOrWhiteSpace(page.Description))
            {
                return Truncate(page.Description.Trim(), MaxSummaryLength);
            }

            var firstContent = pageChunks.FirstOrDefault()?.Content;
            if (string.IsNullOrWhiteSpace(firstContent))
            {
                return null;
            }

            var singleLine = Regex.Replace(firstContent, @"\s+", " ").Trim();
            return Truncate(singleLine, MaxSummaryLength);
        }

        private static List<string> ExtractKeywords(RagPageDocument page)
        {
            var sourceParts = new List<string>();
            if (!string.IsNullOrWhiteSpace(page.Title))
            {
                sourceParts.Add(page.Title);
            }

            if (page.Headings != null)
            {
                sourceParts.AddRange(page.Headings);
            }

            if (!string.IsNullOrWhiteSpace(page.Description))
            {
                sourceParts.Add(page.Description);
            }

            var combined = string.Join(" ", sourceParts);
            var keywords = new List<string>();
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (Match match in WordRegex.Matches(combined))
            {
                var word = match.Value.ToLowerInvariant();
                if (StopWords.Contains(word) || !seen.Add(word))
                {
                    continue;
                }

                keywords.Add(word);
                if (keywords.Count >= MaxKeywordsPerPage)
                {
                    break;
                }
            }

            return keywords;
        }

        private static string Truncate(string value, int maxLength)
        {
            if (string.IsNullOrEmpty(value) || value.Length <= maxLength)
            {
                return value;
            }

            var cut = maxLength - 3;
            if (cut > 0 && char.IsHighSurrogate(value[cut - 1]))
            {
                cut--;
            }

            return value.Substring(0, cut).TrimEnd() + "...";
        }
    }
}
