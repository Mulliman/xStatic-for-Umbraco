using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using XStatic.Core.Generator.Storage;

namespace XStatic.Core.Rag
{
    public interface IRagExportService
    {
        Task<RagExportResult> ExportAsync(
            int staticSiteId,
            RagExportOptions options,
            IReadOnlyDictionary<string, RagPageMetadata> pageMetadata = null,
            IDictionary<string, string> actionParameters = null,
            CancellationToken cancellationToken = default);
    }

    public class RagExportService : IRagExportService
    {
        private readonly IStaticSiteStorer _staticSiteStorer;
        private readonly IHtmlContentExtractor _contentExtractor;
        private readonly IRagChunker _chunker;
        private readonly IRagChunkSerializer _serializer;
        private readonly IWebMcpIndexBuilder _webMcpIndexBuilder;
        private readonly IEnumerable<IVectorStorePusher> _vectorStorePushers;

        public RagExportService(
            IStaticSiteStorer staticSiteStorer,
            IHtmlContentExtractor contentExtractor,
            IRagChunker chunker,
            IRagChunkSerializer serializer,
            IWebMcpIndexBuilder webMcpIndexBuilder,
            IEnumerable<IVectorStorePusher> vectorStorePushers = null)
        {
            _staticSiteStorer = staticSiteStorer ?? throw new ArgumentNullException(nameof(staticSiteStorer));
            _contentExtractor = contentExtractor ?? throw new ArgumentNullException(nameof(contentExtractor));
            _chunker = chunker ?? throw new ArgumentNullException(nameof(chunker));
            _serializer = serializer ?? throw new ArgumentNullException(nameof(serializer));
            _webMcpIndexBuilder = webMcpIndexBuilder ?? throw new ArgumentNullException(nameof(webMcpIndexBuilder));
            _vectorStorePushers = vectorStorePushers ?? Enumerable.Empty<IVectorStorePusher>();
        }

        public async Task<RagExportResult> ExportAsync(
            int staticSiteId,
            RagExportOptions options,
            IReadOnlyDictionary<string, RagPageMetadata> pageMetadata = null,
            IDictionary<string, string> actionParameters = null,
            CancellationToken cancellationToken = default)
        {
            options ??= new RagExportOptions();
            var generatedAt = DateTimeOffset.UtcNow;
            var siteRoot = _staticSiteStorer.GetStorageLocationOfSite(staticSiteId);

            if (string.IsNullOrWhiteSpace(siteRoot) || !Directory.Exists(siteRoot))
            {
                throw new DirectoryNotFoundException($"Generated static site folder not found for site {staticSiteId}: '{siteRoot}'.");
            }

            var outputPath = ValidateRelativeOutputPath(siteRoot, options.GetEffectiveOutputPath(), nameof(options.OutputPath));
            var indexPath = options.GenerateWebMcpIndex
                ? ValidateRelativeOutputPath(siteRoot, options.GetEffectiveWebMcpIndexPath(), nameof(options.WebMcpIndexPath))
                : null;

            var normalizedBaseUrl = NormalizeBaseUrl(options.BaseUrl);

            var htmlFiles = Directory.EnumerateFiles(siteRoot, "*.*", SearchOption.AllDirectories)
                .Where(f => f.EndsWith(".html", StringComparison.OrdinalIgnoreCase) ||
                            f.EndsWith(".htm", StringComparison.OrdinalIgnoreCase))
                .OrderBy(f => f, StringComparer.OrdinalIgnoreCase)
                .ToList();

            var pages = new List<RagPageDocument>();
            var allChunks = new List<RagChunk>();
            var writtenFiles = new List<string>();

            foreach (var filePath in htmlFiles)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var relativeFilePath = Path.GetRelativePath(siteRoot, filePath).Replace('\\', '/');
                var relativeUrl = ToRelativeUrl(relativeFilePath);

                if (IsExcludedPath(relativeUrl, relativeFilePath, options.ExcludedPaths))
                {
                    continue;
                }

                var metadata = FindMetadata(pageMetadata, relativeUrl, relativeFilePath);
                if (IsExcludedDocType(metadata?.DocType, options.ExcludedDocTypes))
                {
                    continue;
                }

                var html = await File.ReadAllTextAsync(filePath, Encoding.UTF8, cancellationToken).ConfigureAwait(false);
                var canonicalUrl = BuildCanonicalUrl(normalizedBaseUrl, relativeUrl);

                var document = _contentExtractor.Extract(html, canonicalUrl, relativeFilePath, metadata);
                if (!document.LastModified.HasValue)
                {
                    document.LastModified = new DateTimeOffset(File.GetLastWriteTimeUtc(filePath), TimeSpan.Zero);
                }

                var pageChunks = _chunker.ChunkDocument(document, options);
                pages.Add(document);
                allChunks.AddRange(pageChunks);
            }

            var siteIdSegment = staticSiteId.ToString();
            var utf8NoBom = new UTF8Encoding(encoderShouldEmitUTF8Identifier: false);
            Dictionary<string, string> markdownChunkPaths = null;

            switch (options.OutputFormat)
            {
                case RagExportFormat.Json:
                {
                    var json = _serializer.SerializeJson(allChunks, options, generatedAt);
                    var storedPath = await _staticSiteStorer.StoreSiteItem(siteIdSegment, outputPath, json, utf8NoBom).ConfigureAwait(false);
                    writtenFiles.Add(storedPath);
                    break;
                }
                case RagExportFormat.Jsonl:
                {
                    var jsonl = _serializer.SerializeJsonl(allChunks);
                    var storedPath = await _staticSiteStorer.StoreSiteItem(siteIdSegment, outputPath, jsonl, utf8NoBom).ConfigureAwait(false);
                    writtenFiles.Add(storedPath);
                    break;
                }
                case RagExportFormat.Markdown:
                {
                    CleanStaleMarkdownFolder(siteRoot, outputPath);
                    markdownChunkPaths = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

                    foreach (var chunk in allChunks)
                    {
                        cancellationToken.ThrowIfCancellationRequested();

                        var md = _serializer.SerializeMarkdown(chunk);
                        var chunkRelativePath = _serializer.GetMarkdownChunkRelativePath(chunk, outputPath);
                        var storedPath = await _staticSiteStorer.StoreSiteItem(siteIdSegment, chunkRelativePath, md, utf8NoBom).ConfigureAwait(false);
                        writtenFiles.Add(storedPath);
                        markdownChunkPaths[chunk.Id] = chunkRelativePath;
                    }
                    break;
                }
            }

            WebMcpIndex webMcpIndex = null;
            if (options.GenerateWebMcpIndex)
            {
                webMcpIndex = _webMcpIndexBuilder.Build(pages, allChunks, options, generatedAt, markdownChunkPaths);
                var indexJson = _webMcpIndexBuilder.Serialize(webMcpIndex);
                var storedIndexPath = await _staticSiteStorer.StoreSiteItem(siteIdSegment, indexPath, indexJson, utf8NoBom).ConfigureAwait(false);
                writtenFiles.Add(storedIndexPath);
            }

            var vectorStoreResults = new List<VectorStorePushResult>();
            var pushers = _vectorStorePushers.ToList();
            if (pushers.Count > 0)
            {
                var pushContext = new VectorStorePushContext
                {
                    StaticSiteId = staticSiteId,
                    SiteName = options.SiteName,
                    BaseUrl = normalizedBaseUrl,
                    Chunks = allChunks,
                    WebMcpIndex = webMcpIndex,
                    Options = options,
                    Parameters = actionParameters != null
                        ? new Dictionary<string, string>(actionParameters, StringComparer.OrdinalIgnoreCase)
                        : new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                };

                foreach (var pusher in pushers)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    try
                    {
                        var pushResult = await pusher.PushAsync(pushContext, cancellationToken).ConfigureAwait(false);
                        if (pushResult != null)
                        {
                            vectorStoreResults.Add(pushResult);
                        }
                    }
                    catch (OperationCanceledException)
                    {
                        throw;
                    }
                    catch (Exception ex)
                    {
                        var name = pusher?.Name ?? pusher?.GetType().Name ?? "UnknownPusher";
                        vectorStoreResults.Add(VectorStorePushResult.Error(name, $"Vector store push failed for '{name}': {ex.Message}", ex));
                    }
                }
            }

            return new RagExportResult
            {
                StaticSiteId = staticSiteId,
                GeneratedAt = generatedAt,
                Pages = pages,
                Chunks = allChunks,
                WrittenFiles = writtenFiles,
                WebMcpIndex = webMcpIndex,
                VectorStoreResults = vectorStoreResults
            };
        }

        internal static string NormalizeBaseUrl(string baseUrl)
        {
            if (string.IsNullOrWhiteSpace(baseUrl))
            {
                return string.Empty;
            }

            var trimmed = baseUrl.Trim().TrimEnd('/');
            if (!trimmed.Contains("://", StringComparison.Ordinal))
            {
                trimmed = "https://" + trimmed.TrimStart('/');
            }

            if (Uri.TryCreate(trimmed, UriKind.Absolute, out var uri) &&
                (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps))
            {
                return trimmed;
            }

            return string.Empty;
        }

        internal static string ValidateRelativeOutputPath(string siteRoot, string relativePath, string paramName)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
            {
                throw new ArgumentException("Output path cannot be empty.", paramName);
            }

            var trimmed = relativePath.Trim().TrimStart('/', '\\');
            if (Path.IsPathRooted(trimmed))
            {
                throw new ArgumentException($"Output path '{relativePath}' must be relative to the site root.", paramName);
            }

            var fullRoot = Path.GetFullPath(siteRoot).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            var fullTarget = Path.GetFullPath(Path.Combine(fullRoot, trimmed));

            var isSameOrInside = string.Equals(fullTarget, fullRoot, StringComparison.OrdinalIgnoreCase) ||
                fullTarget.StartsWith(fullRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase);

            if (!isSameOrInside)
            {
                throw new ArgumentException($"Output path '{relativePath}' resolves outside the generated site folder.", paramName);
            }

            return trimmed.Replace('\\', '/');
        }

        private static void CleanStaleMarkdownFolder(string siteRoot, string outputFolder)
        {
            var fullRoot = Path.GetFullPath(siteRoot).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            var targetDir = Path.GetFullPath(Path.Combine(fullRoot, outputFolder));

            // Never wipe the site root itself; only clean a dedicated subfolder
            if (string.Equals(targetDir, fullRoot, StringComparison.OrdinalIgnoreCase) || !Directory.Exists(targetDir))
            {
                return;
            }

            foreach (var existingMd in Directory.EnumerateFiles(targetDir, "*.md", SearchOption.TopDirectoryOnly))
            {
                File.Delete(existingMd);
            }
        }

        internal static string ToRelativeUrl(string relativeFilePath)
        {
            if (string.IsNullOrWhiteSpace(relativeFilePath))
            {
                return "/";
            }

            var normalized = relativeFilePath.Replace('\\', '/').TrimStart('/');
            if (string.Equals(normalized, "index.html", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(normalized, "index.htm", StringComparison.OrdinalIgnoreCase))
            {
                return "/";
            }

            if (normalized.EndsWith("/index.html", StringComparison.OrdinalIgnoreCase))
            {
                return "/" + normalized.Substring(0, normalized.Length - "index.html".Length);
            }

            if (normalized.EndsWith("/index.htm", StringComparison.OrdinalIgnoreCase))
            {
                return "/" + normalized.Substring(0, normalized.Length - "index.htm".Length);
            }

            return "/" + normalized;
        }

        internal static string BuildCanonicalUrl(string baseUrl, string relativeUrl)
        {
            var normalizedBase = NormalizeBaseUrl(baseUrl);
            if (string.IsNullOrWhiteSpace(normalizedBase))
            {
                return relativeUrl;
            }

            var trimmedRel = string.IsNullOrEmpty(relativeUrl) ? "/" : (relativeUrl.StartsWith("/") ? relativeUrl : "/" + relativeUrl);
            return normalizedBase + trimmedRel;
        }

        internal static bool IsExcludedPath(string relativeUrl, string relativeFilePath, IList<string> excludedPaths)
        {
            if (excludedPaths == null || excludedPaths.Count == 0)
            {
                return false;
            }

            var url = NormalizeComparablePath(relativeUrl);
            var file = NormalizeComparablePath(relativeFilePath);

            foreach (var rawPattern in excludedPaths)
            {
                if (string.IsNullOrWhiteSpace(rawPattern))
                {
                    continue;
                }

                var pattern = rawPattern.Trim().Replace('\\', '/');
                if (!pattern.StartsWith("/"))
                {
                    pattern = "/" + pattern;
                }

                if (pattern.EndsWith("/*", StringComparison.Ordinal))
                {
                    var prefix = pattern.Substring(0, pattern.Length - 2).TrimEnd('/');
                    if (MatchesPrefix(url, prefix) || MatchesPrefix(file, prefix))
                    {
                        return true;
                    }
                }
                else if (pattern.EndsWith("*", StringComparison.Ordinal))
                {
                    var prefix = pattern.Substring(0, pattern.Length - 1);
                    if (url.StartsWith(prefix, StringComparison.OrdinalIgnoreCase) ||
                        file.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                    {
                        return true;
                    }
                }
                else
                {
                    var normalizedPattern = NormalizeComparablePath(pattern);
                    if (string.Equals(url, normalizedPattern, StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(file, normalizedPattern, StringComparison.OrdinalIgnoreCase))
                    {
                        return true;
                    }
                }
            }

            return false;
        }

        internal static bool IsExcludedDocType(string docType, IList<string> excludedDocTypes)
        {
            if (string.IsNullOrWhiteSpace(docType) || excludedDocTypes == null || excludedDocTypes.Count == 0)
            {
                return false;
            }

            return excludedDocTypes.Any(x => string.Equals(x?.Trim(), docType.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        private static RagPageMetadata FindMetadata(
            IReadOnlyDictionary<string, RagPageMetadata> metadataMap,
            string relativeUrl,
            string relativeFilePath)
        {
            if (metadataMap == null || metadataMap.Count == 0)
            {
                return null;
            }

            var candidates = new[]
            {
                relativeUrl,
                relativeUrl.TrimEnd('/'),
                relativeUrl.EndsWith("/") ? relativeUrl : relativeUrl + "/",
                "/" + relativeFilePath.TrimStart('/'),
                relativeFilePath
            };

            foreach (var candidate in candidates)
            {
                var key = string.IsNullOrEmpty(candidate) ? "/" : candidate;
                if (metadataMap.TryGetValue(key, out var found))
                {
                    return found;
                }
            }

            return null;
        }

        private static string NormalizeComparablePath(string path)
        {
            if (string.IsNullOrWhiteSpace(path))
            {
                return "/";
            }

            var normalized = path.Trim().Replace('\\', '/');
            if (!normalized.StartsWith("/"))
            {
                normalized = "/" + normalized;
            }

            if (normalized.Length > 1)
            {
                normalized = normalized.TrimEnd('/');
            }

            return normalized;
        }

        private static bool MatchesPrefix(string value, string prefix)
        {
            if (string.IsNullOrEmpty(prefix))
            {
                return true;
            }

            return string.Equals(value, prefix, StringComparison.OrdinalIgnoreCase) ||
                   value.StartsWith(prefix + "/", StringComparison.OrdinalIgnoreCase);
        }
    }
}
