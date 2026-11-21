using System.Text;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using XStatic.AI.Audit;
using XStatic.AI.Composition;
using XStatic.AI.Configuration;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Repositories;
using Xunit;

namespace XStatic.AI.Tests;

public class GeoSeoAuditTests : IDisposable
{
    private readonly string _tempDir;

    public GeoSeoAuditTests()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), "xstatic-ai-audit-tests-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_tempDir);
    }

    public void Dispose()
    {
        if (Directory.Exists(_tempDir))
        {
            Directory.Delete(_tempDir, recursive: true);
        }
    }

    [Fact]
    public void HtmlPageSignalExtractor_DetectsSeoAndGeoIssuesAccurately()
    {
        WritePage("index.html", """
            <!doctype html>
            <html>
              <head>
                <title>Home Page</title>
                <meta name="description" content="Welcome to our static Umbraco site." />
                <meta property="og:title" content="Home Page" />
                <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite"}</script>
              </head>
              <body>
                <h1>Welcome</h1>
                <p>This is a healthy page with a valid link to <a href="/about/">About</a>.</p>
                <img src="/logo.png" alt="Company Logo" />
              </body>
            </html>
            """);

        WritePage("about/index.html", """
            <!doctype html>
            <html>
              <head></head>
              <body>
                <p>Short text with <a href="/missing-page/">broken link</a>.</p>
                <img src="/team.jpg" />
                <img src="/office.jpg" alt="   " />
              </body>
            </html>
            """);

        var extractor = new HtmlPageSignalExtractor();
        var snapshots = extractor.ExtractFromDirectory(
            _tempDir,
            maxPages: 10,
            maxCharactersPerPage: 2000,
            thinContentWordThreshold: 20,
            includePathPrefixes: null,
            out var totalDiscovered);

        Assert.Equal(2, totalDiscovered);
        Assert.Equal(2, snapshots.Count);

        var home = snapshots.Single(s => s.RelativePath == "/index.html");
        Assert.Equal("Home Page", home.Title);
        Assert.True(home.HasJsonLdStructuredData);
        Assert.True(home.HasOpenGraphTags);
        Assert.Equal(0, home.ImagesMissingAltCount);
        Assert.Empty(home.BrokenInternalLinks);

        var about = snapshots.Single(s => s.RelativePath == "/about/index.html");
        Assert.Null(about.Title);
        Assert.Null(about.MetaDescription);
        Assert.Equal(0, about.H1Count);
        Assert.Equal(2, about.ImagesMissingAltCount);
        Assert.Single(about.BrokenInternalLinks, "/missing-page/");
        Assert.Contains(about.DeterministicIssues, i => i.Severity == AuditSeverity.Critical && i.Category == "Metadata");
        Assert.Contains(about.DeterministicIssues, i => i.Severity == AuditSeverity.Critical && i.Category == "Links");
        Assert.Contains(about.DeterministicIssues, i => i.Severity == AuditSeverity.Warning && i.Category == "Accessibility");
        Assert.Contains(about.DeterministicIssues, i => i.Severity == AuditSeverity.Warning && i.Category == "Content");
    }

    [Fact]
    public async Task GeoSeoAuditService_CallsMockedIChatClient_AndBuildsReport()
    {
        WritePage("index.html", "<html><head><title>Landing</title></head><body><h1>Landing</h1><p>Hello world</p></body></html>");

        var sitesRepo = new Mock<ISitesRepository>();
        sitesRepo.Setup(r => r.Get<SiteConfig>(1)).Returns(new SiteConfig
        {
            Id = 1,
            Name = "Corporate Site",
            TargetHostname = "https://corp.example.com"
        });

        var storer = new Mock<IStaticSiteStorer>();
        storer.Setup(s => s.GetStorageLocationOfSite(1)).Returns(_tempDir);

        IEnumerable<ChatMessage>? capturedMessages = null;
        var chatClient = new Mock<IChatClient>();
        chatClient
            .Setup(c => c.GetResponseAsync(
                It.IsAny<IEnumerable<ChatMessage>>(),
                It.IsAny<ChatOptions?>(),
                It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<ChatMessage>, ChatOptions?, CancellationToken>((msgs, _, _) => capturedMessages = msgs.ToList())
            .ReturnsAsync(new ChatResponse(new ChatMessage(ChatRole.Assistant, "### Summary\nAdd a meta description and JSON-LD to `/index.html`."))
            {
                ModelId = "mock-model-1"
            });

        var resolver = new Mock<IXStaticChatClientResolver>();
        resolver.Setup(r => r.Resolve("seo-profile")).Returns(chatClient.Object);

        var service = new GeoSeoAuditService(
            sitesRepo.Object,
            storer.Object,
            new HtmlPageSignalExtractor(),
            resolver.Object,
            Options.Create(new XStaticAIOptions { ProfileAlias = "seo-profile" }),
            NullLogger<GeoSeoAuditService>.Instance);

        var result = await service.AuditSiteAsync(1);

        Assert.True(result.WasSuccessful);
        Assert.NotNull(result.Data);
        Assert.Equal("mock-model-1", result.Data.ModelId);
        Assert.Equal(1, result.Data.AuditedPageCount);
        Assert.Contains("Add a meta description", result.Data.AiSummaryMarkdown);
        Assert.NotNull(capturedMessages);
        Assert.Contains(capturedMessages, m => m.Role == ChatRole.User && m.Text.Contains("/index.html"));

        var markdown = service.FormatMarkdownReport(result.Data);
        Assert.Contains("# xStatic AI Pre-Deploy GEO/SEO Audit: Corporate Site", markdown);
        Assert.Contains("## Deterministic Findings", markdown);
        Assert.Contains("## AI GEO/SEO Review", markdown);
    }

    [Fact]
    public async Task GeoSeoAuditService_ReturnsError_WhenNoIChatClientConfigured()
    {
        WritePage("index.html", "<html><head><title>Landing</title></head><body><h1>Landing</h1></body></html>");

        var sitesRepo = new Mock<ISitesRepository>();
        sitesRepo.Setup(r => r.Get<SiteConfig>(1)).Returns(new SiteConfig { Id = 1, Name = "Site" });

        var storer = new Mock<IStaticSiteStorer>();
        storer.Setup(s => s.GetStorageLocationOfSite(1)).Returns(_tempDir);

        var resolver = new Mock<IXStaticChatClientResolver>();
        resolver.Setup(r => r.Resolve(It.IsAny<string?>())).Returns((IChatClient?)null);

        var service = new GeoSeoAuditService(
            sitesRepo.Object,
            storer.Object,
            new HtmlPageSignalExtractor(),
            resolver.Object,
            Options.Create(new XStaticAIOptions()),
            NullLogger<GeoSeoAuditService>.Instance);

        var result = await service.AuditSiteAsync(1);

        Assert.False(result.WasSuccessful);
        Assert.Contains("IChatClient", result.Message);
    }

    [Fact]
    public async Task AiPreDeployAuditAction_WritesMarkdownAndJsonReports_AndRespectsFailOnCritical()
    {
        var storedFiles = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var storer = new Mock<IStaticSiteStorer>();
        storer
            .Setup(s => s.StoreSiteItem(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Encoding>()))
            .Callback<string, string, string, Encoding>((_, path, content, _) => storedFiles[path] = content)
            .ReturnsAsync((string _, string path, string _, Encoding _) => path);

        var report = new AiAuditReport(
            StaticSiteId: 9,
            SiteName: "Blog",
            GeneratedAtUtc: DateTimeOffset.UtcNow,
            TotalHtmlFilesDiscovered: 3,
            AuditedPageCount: 2,
            CriticalIssueCount: 1,
            WarningIssueCount: 2,
            Pages: [],
            Issues: [new PageAuditIssue("/post/index.html", AuditSeverity.Critical, "Links", "Broken internal link: '/404-target'.")],
            AiSummaryMarkdown: "Fix broken link on `/post/index.html`.");

        var auditService = new Mock<IGeoSeoAuditService>();
        auditService
            .Setup(s => s.AuditSiteAsync(9, It.IsAny<AiAuditRequestOptions?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(XStatic.Core.XStaticResult<AiAuditReport>.Success(report));
        auditService
            .Setup(s => s.FormatMarkdownReport(report))
            .Returns("# Audit Report\nFix broken link.");

        var action = new AiPreDeployAuditAction(
            auditService.Object,
            storer.Object,
            Options.Create(new XStaticAIOptions { WriteJsonReport = true }));

        var result = await action.RunAction(9, new Dictionary<string, string>
        {
            [AiPreDeployAuditFields.ReportPath] = ".xstatic-ai-audit.md",
            [AiPreDeployAuditFields.FailOnCritical] = "true"
        });

        Assert.False(result.WasSuccessful);
        Assert.Contains("1 critical issue", result.Message);
        Assert.True(storedFiles.ContainsKey(".xstatic-ai-audit.md"));
        Assert.True(storedFiles.ContainsKey(".xstatic-ai-audit.json"));
        Assert.Contains("Fix broken link.", storedFiles[".xstatic-ai-audit.md"]);
        Assert.Contains("/post/index.html", storedFiles[".xstatic-ai-audit.json"]);
    }

    [Fact]
    public void AddXStaticAIChatClient_ResolvesProfileSpecificClientFromCustomFactory()
    {
        var mockClient = new Mock<IChatClient>().Object;
        string? requestedAlias = null;

        var services = new ServiceCollection();
        services.AddXStaticAI(o => o.ProfileAlias = "umbraco-geo-audit");
        services.AddXStaticAIChatClient((_, alias) =>
        {
            requestedAlias = alias;
            return mockClient;
        });

        using var provider = services.BuildServiceProvider();
        var resolver = provider.GetRequiredService<IXStaticChatClientResolver>();
        var resolved = resolver.Resolve("umbraco-geo-audit");

        Assert.Same(mockClient, resolved);
        Assert.Equal("umbraco-geo-audit", requestedAlias);
    }

    private void WritePage(string relativePath, string html)
    {
        var fullPath = Path.Combine(_tempDir, relativePath.Replace('/', Path.DirectorySeparatorChar));
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
        File.WriteAllText(fullPath, html);
    }
}
