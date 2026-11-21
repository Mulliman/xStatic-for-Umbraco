using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using XStatic.Core.Actions;
using XStatic.Core.App;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Rag;
using XStatic.Core.Repositories;
using Xunit;

namespace XStatic.Core.Tests.Rag
{
    public sealed class RagExportServiceAndActionTests : IDisposable
    {
        private readonly string _root;

        public RagExportServiceAndActionTests()
        {
            _root = Path.Combine(Path.GetTempPath(), "xstatic-rag-tests-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(_root);
        }

        public void Dispose()
        {
            try { Directory.Delete(_root, recursive: true); } catch { /* best effort */ }
        }

        private string CreateSiteHtml(int siteId, string relativePath, string html)
        {
            var siteDir = Path.Combine(_root, siteId.ToString());
            var fullPath = Path.Combine(siteDir, relativePath.Replace('/', Path.DirectorySeparatorChar));
            Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
            File.WriteAllText(fullPath, html, Encoding.UTF8);
            return siteDir;
        }

        private Mock<IStaticSiteStorer> CreateTempStorer(int siteId)
        {
            var siteDir = Path.Combine(_root, siteId.ToString());
            Directory.CreateDirectory(siteDir);

            var storer = new Mock<IStaticSiteStorer>();
            storer.Setup(s => s.GetStorageLocationOfSite(siteId)).Returns(siteDir);
            storer.Setup(s => s.StoreSiteItem(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Encoding>()))
                .Returns<string, string, string, Encoding>(async (subFolder, path, contents, encoding) =>
                {
                    var dest = Path.Combine(_root, subFolder, path.TrimStart('/', '\\').Replace('/', Path.DirectorySeparatorChar));
                    Directory.CreateDirectory(Path.GetDirectoryName(dest)!);
                    await File.WriteAllTextAsync(dest, contents, encoding);
                    return dest;
                });

            return storer;
        }

        [Fact]
        public async Task ExportAsync_ExportsJsonlAndWebMcpIndex_AndRespectsExclusions()
        {
            const int siteId = 42;
            CreateSiteHtml(siteId, "index.html", "<html><head><title>Home</title></head><body><main><h1>Home</h1><p>Welcome home.</p></main></body></html>");
            CreateSiteHtml(siteId, "about/index.html", "<html><head><title>About</title></head><body><main><h1>About</h1><p>About xStatic.</p></main></body></html>");
            CreateSiteHtml(siteId, "admin/secret/index.html", "<html><head><title>Admin</title></head><body><main><h1>Secret</h1><p>Do not index.</p></main></body></html>");
            CreateSiteHtml(siteId, "sitemap/index.html", "<html><head><title>Sitemap</title></head><body><main><h1>Sitemap</h1><p>Excluded by doctype.</p></main></body></html>");

            var storer = CreateTempStorer(siteId);
            var pusher = new RecordingVectorStorePusher(batchSize: 1);

            var service = new RagExportService(
                storer.Object,
                new HtmlContentExtractor(),
                new RagChunker(),
                new RagChunkSerializer(),
                new WebMcpIndexBuilder(),
                new[] { pusher });

            var metadata = new Dictionary<string, RagPageMetadata>(StringComparer.OrdinalIgnoreCase)
            {
                ["/sitemap/"] = new RagPageMetadata { DocType = "xmlSitemap" },
                ["/about/"] = new RagPageMetadata { DocType = "contentPage" }
            };

            var options = new RagExportOptions
            {
                SiteName = "Test Site",
                BaseUrl = "https://example.com",
                OutputFormat = RagExportFormat.Jsonl,
                ExcludedPaths = new List<string> { "/admin/*" },
                ExcludedDocTypes = new List<string> { "xmlSitemap" },
                GenerateWebMcpIndex = true
            };

            var result = await service.ExportAsync(siteId, options, metadata);

            Assert.Equal(2, result.Pages.Count);
            Assert.Equal(2, result.Chunks.Count);
            Assert.DoesNotContain(result.Pages, p => p.Url.Contains("/admin/"));
            Assert.DoesNotContain(result.Pages, p => p.Url.Contains("/sitemap/"));

            var jsonlPath = Path.Combine(_root, siteId.ToString(), "rag-chunks.jsonl");
            var indexPath = Path.Combine(_root, siteId.ToString(), "webmcp-index.json");
            Assert.True(File.Exists(jsonlPath));
            Assert.True(File.Exists(indexPath));

            var jsonlLines = File.ReadAllLines(jsonlPath);
            Assert.Equal(2, jsonlLines.Length);

            using var indexDoc = JsonDocument.Parse(File.ReadAllText(indexPath));
            Assert.Equal(2, indexDoc.RootElement.GetProperty("totalPages").GetInt32());
            Assert.Equal(2, indexDoc.RootElement.GetProperty("totalChunks").GetInt32());

            // Verify VectorStorePusherBase batched 2 chunks with batchSize=1 into 2 batches
            Assert.Equal(2, pusher.BatchesReceived.Count);
            Assert.Single(result.VectorStoreResults);
            Assert.True(result.VectorStoreResults[0].WasSuccessful);
            Assert.Equal(2, result.VectorStoreResults[0].UpsertedCount);
        }

        [Fact]
        public async Task ExportAsync_MarkdownFormat_WritesPerChunkMarkdownFiles()
        {
            const int siteId = 7;
            CreateSiteHtml(siteId, "docs/index.html", "<html><head><title>Docs</title></head><body><main><h1>Docs</h1><p>First.</p><h2>Usage</h2><p>Second.</p></main></body></html>");

            var storer = CreateTempStorer(siteId);
            var service = new RagExportService(
                storer.Object,
                new HtmlContentExtractor(),
                new RagChunker(),
                new RagChunkSerializer(),
                new WebMcpIndexBuilder());

            var result = await service.ExportAsync(siteId, new RagExportOptions
            {
                OutputFormat = RagExportFormat.Markdown,
                GenerateWebMcpIndex = false
            });

            Assert.Equal(2, result.Chunks.Count);
            Assert.Equal(2, result.WrittenFiles.Count);
            Assert.All(result.WrittenFiles, path =>
            {
                Assert.EndsWith(".md", path);
                Assert.True(File.Exists(path));
            });
            Assert.Null(result.WebMcpIndex);
        }

        [Fact]
        public async Task RagExportPostGenerationAction_RunsExportAndHandlesMissingSiteConfig()
        {
            const int siteId = 99;
            CreateSiteHtml(siteId, "index.html", "<html><head><title>Home</title></head><body><main><h1>Home</h1><p>Body text.</p></main></body></html>");

            var storer = CreateTempStorer(siteId);
            var exportService = new RagExportService(
                storer.Object,
                new HtmlContentExtractor(),
                new RagChunker(),
                new RagChunkSerializer(),
                new WebMcpIndexBuilder());

            var sitesRepo = new Mock<ISitesRepository>();
            sitesRepo.Setup(r => r.Get<SiteConfig>(siteId)).Returns(new SiteConfig
            {
                Id = siteId,
                Name = "My Site",
                TargetHostname = "https://mysite.test"
            });

            var action = new RagExportPostGenerationAction(sitesRepo.Object, exportService);

            var missingResult = await action.RunAction(12345, new Dictionary<string, string>());
            Assert.False(missingResult.WasSuccessful);

            var okResult = await action.RunAction(siteId, new Dictionary<string, string>
            {
                [RagExportFields.OutputFormat] = "json",
                [RagExportFields.MaxChunkSize] = "500",
                [RagExportFields.GenerateWebMcpIndex] = "true"
            });

            Assert.True(okResult.WasSuccessful);
            Assert.True(File.Exists(Path.Combine(_root, siteId.ToString(), "rag-chunks.json")));
            Assert.True(File.Exists(Path.Combine(_root, siteId.ToString(), "webmcp-index.json")));
        }

        [Fact]
        public async Task VectorStorePusherBase_ReturnsErrorResultWhenBatchThrows()
        {
            var failingPusher = new FailingVectorStorePusher();
            var context = new VectorStorePushContext
            {
                StaticSiteId = 1,
                Chunks = new List<RagChunk> { new RagChunk { Id = "/#chunk-0", Content = "Hello" } }
            };

            var result = await failingPusher.PushAsync(context);

            Assert.False(result.WasSuccessful);
            Assert.Equal("FailingPusher", result.PusherName);
            Assert.Contains("boom", result.Message);
            Assert.NotNull(result.Exception);
        }

        [Fact]
        public async Task ExportAsync_NormalizesBareHostnameToHttpsUrl()
        {
            const int siteId = 101;
            CreateSiteHtml(siteId, "about/index.html", "<html><head><title>About</title></head><body><main><h1>About</h1><p>Hello.</p></main></body></html>");

            var storer = CreateTempStorer(siteId);
            var service = new RagExportService(
                storer.Object,
                new HtmlContentExtractor(),
                new RagChunker(),
                new RagChunkSerializer(),
                new WebMcpIndexBuilder());

            var result = await service.ExportAsync(siteId, new RagExportOptions
            {
                BaseUrl = "example.com",
                OutputFormat = RagExportFormat.Jsonl,
                GenerateWebMcpIndex = true
            });

            var chunk = Assert.Single(result.Chunks);
            Assert.Equal("https://example.com/about/", chunk.Url);
            Assert.Equal("https://example.com/about/#chunk-0", chunk.Id);
            Assert.Equal("https://example.com", result.WebMcpIndex.BaseUrl);
        }

        [Fact]
        public async Task ExportAsync_RejectsOutputPathsEscapingSiteRoot()
        {
            const int siteId = 102;
            CreateSiteHtml(siteId, "index.html", "<html><body><main><p>Home</p></main></body></html>");

            var storer = CreateTempStorer(siteId);
            var service = new RagExportService(
                storer.Object,
                new HtmlContentExtractor(),
                new RagChunker(),
                new RagChunkSerializer(),
                new WebMcpIndexBuilder());

            await Assert.ThrowsAsync<ArgumentException>(() => service.ExportAsync(siteId, new RagExportOptions
            {
                OutputPath = "../../../outside.jsonl"
            }));

            await Assert.ThrowsAsync<ArgumentException>(() => service.ExportAsync(siteId, new RagExportOptions
            {
                GenerateWebMcpIndex = true,
                WebMcpIndexPath = "../outside-index.json"
            }));
        }

        [Fact]
        public async Task ExportAsync_MarkdownFormat_CleansStaleMarkdownFilesBeforeWriting()
        {
            const int siteId = 103;
            CreateSiteHtml(siteId, "index.html", "<html><body><main><h1>Home</h1><p>Fresh.</p></main></body></html>");
            var staleFile = Path.Combine(_root, siteId.ToString(), "rag-chunks", "deleted-page-00000000-chunk-0000.md");
            Directory.CreateDirectory(Path.GetDirectoryName(staleFile)!);
            File.WriteAllText(staleFile, "stale");

            var storer = CreateTempStorer(siteId);
            var service = new RagExportService(
                storer.Object,
                new HtmlContentExtractor(),
                new RagChunker(),
                new RagChunkSerializer(),
                new WebMcpIndexBuilder());

            var result = await service.ExportAsync(siteId, new RagExportOptions
            {
                OutputFormat = RagExportFormat.Markdown,
                GenerateWebMcpIndex = true
            });

            Assert.False(File.Exists(staleFile));
            Assert.Single(result.Chunks);
            Assert.NotNull(result.WebMcpIndex);
            Assert.Single(result.WebMcpIndex.Pages[0].ChunkFiles);
        }

        [Fact]
        public async Task ExportAsync_RawVectorStorePusherException_IsCapturedAndDoesNotSkipSubsequentPushers()
        {
            const int siteId = 104;
            CreateSiteHtml(siteId, "index.html", "<html><body><main><p>Body</p></main></body></html>");

            var storer = CreateTempStorer(siteId);
            var rawThrowingPusher = new Mock<IVectorStorePusher>();
            rawThrowingPusher.SetupGet(p => p.Name).Returns("RawThrowingPusher");
            rawThrowingPusher.Setup(p => p.PushAsync(It.IsAny<VectorStorePushContext>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new InvalidOperationException("raw failure"));

            var recordingPusher = new RecordingVectorStorePusher(batchSize: 10);

            var service = new RagExportService(
                storer.Object,
                new HtmlContentExtractor(),
                new RagChunker(),
                new RagChunkSerializer(),
                new WebMcpIndexBuilder(),
                new IVectorStorePusher[] { rawThrowingPusher.Object, recordingPusher });

            var result = await service.ExportAsync(siteId, new RagExportOptions
            {
                GenerateWebMcpIndex = false
            });

            Assert.Equal(2, result.VectorStoreResults.Count);
            Assert.False(result.VectorStoreResults[0].WasSuccessful);
            Assert.Contains("raw failure", result.VectorStoreResults[0].Message);
            Assert.True(result.VectorStoreResults[1].WasSuccessful);
            Assert.Single(recordingPusher.BatchesReceived);
        }

        [Fact]
        public void AddDefaultActions_ResolvesRagExportPostGenerationActionWithoutSeparateRagCall()
        {
            var services = new ServiceCollection();
            services.AddSingleton(Mock.Of<ISitesRepository>());
            services.AddSingleton(Mock.Of<IStaticSiteStorer>());

            new GeneratorServiceBuilder(services).AddDefaultActions();

            using var provider = services.BuildServiceProvider();
            var action = provider.GetService<RagExportPostGenerationAction>();
            Assert.NotNull(action);
        }

        private sealed class RecordingVectorStorePusher : VectorStorePusherBase
        {
            private readonly int _batchSize;

            public RecordingVectorStorePusher(int batchSize)
            {
                _batchSize = batchSize;
            }

            public override string Name => "RecordingPusher";

            protected override int BatchSize => _batchSize;

            public List<IReadOnlyList<RagChunk>> BatchesReceived { get; } = new List<IReadOnlyList<RagChunk>>();

            protected override Task<int> UpsertBatchAsync(IReadOnlyList<RagChunk> batch, VectorStorePushContext context, CancellationToken cancellationToken)
            {
                BatchesReceived.Add(batch);
                return Task.FromResult(batch.Count);
            }
        }

        private sealed class FailingVectorStorePusher : VectorStorePusherBase
        {
            public override string Name => "FailingPusher";

            protected override Task<int> UpsertBatchAsync(IReadOnlyList<RagChunk> batch, VectorStorePushContext context, CancellationToken cancellationToken)
            {
                throw new InvalidOperationException("boom");
            }
        }
    }
}
