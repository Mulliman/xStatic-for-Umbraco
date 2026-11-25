using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using XStatic.AI.Audit;
using XStatic.AI.Composition;
using XStatic.AI.Configuration;
using XStatic.Core.Actions;
using XStatic.Core.Actions.Db;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Repositories;
using Xunit;

namespace XStatic.AI.Tests;

public class GeoSeoAuditTests : IDisposable
{
    private readonly string _tempDir;
    private readonly string _siteOutputDir;
    private readonly string _contentRootDir;

    public GeoSeoAuditTests()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), "xstatic-ai-audit-tests-" + Guid.NewGuid().ToString("N"));
        _siteOutputDir = Path.Combine(_tempDir, "site-output");
        _contentRootDir = Path.Combine(_tempDir, "content-root");
        Directory.CreateDirectory(_siteOutputDir);
        Directory.CreateDirectory(_contentRootDir);
    }

    public void Dispose()
    {
        try { Directory.Delete(_tempDir, recursive: true); } catch { /* best effort */ }
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
            _siteOutputDir,
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
    public void HtmlPageSignalExtractor_RespectsIncludePathBoundaryAndMaxPages()
    {
        WritePage("blog/a.html", "<html><head><title>A</title></head><body><h1>A</h1></body></html>");
        WritePage("blog/b.html", "<html><head><title>B</title></head><body><h1>B</h1></body></html>");
        WritePage("blog-archive/c.html", "<html><head><title>C</title></head><body><h1>C</h1></body></html>");

        var extractor = new HtmlPageSignalExtractor();
        var snapshots = extractor.ExtractFromDirectory(
            _siteOutputDir,
            maxPages: 1,
            maxCharactersPerPage: 1000,
            thinContentWordThreshold: 1,
            includePathPrefixes: ["/blog"],
            out var totalDiscovered);

        Assert.Equal(3, totalDiscovered);
        var single = Assert.Single(snapshots);
        Assert.StartsWith("/blog/", single.RelativePath);
        Assert.DoesNotContain(snapshots, s => s.RelativePath.StartsWith("/blog-archive/"));
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
        storer.Setup(s => s.GetStorageLocationOfSite(1)).Returns(_siteOutputDir);

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
        Assert.True(result.Data.AiSummaryAvailable);
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
    public async Task GeoSeoAuditService_DegradesGracefully_WhenNoIChatClientOrUpstreamThrows()
    {
        WritePage("index.html", "<html><head></head><body><p>Thin</p></body></html>");

        var sitesRepo = new Mock<ISitesRepository>();
        sitesRepo.Setup(r => r.Get<SiteConfig>(1)).Returns(new SiteConfig { Id = 1, Name = "Site" });

        var storer = new Mock<IStaticSiteStorer>();
        storer.Setup(s => s.GetStorageLocationOfSite(1)).Returns(_siteOutputDir);

        // Case 1: No IChatClient registered
        var nullResolver = new Mock<IXStaticChatClientResolver>();
        nullResolver.Setup(r => r.Resolve(It.IsAny<string?>())).Returns((IChatClient?)null);

        var serviceWithoutClient = new GeoSeoAuditService(
            sitesRepo.Object,
            storer.Object,
            new HtmlPageSignalExtractor(),
            nullResolver.Object,
            Options.Create(new XStaticAIOptions()),
            NullLogger<GeoSeoAuditService>.Instance);

        var noClientResult = await serviceWithoutClient.AuditSiteAsync(1);
        Assert.True(noClientResult.WasSuccessful);
        Assert.NotNull(noClientResult.Data);
        Assert.False(noClientResult.Data.AiSummaryAvailable);
        Assert.Equal(1, noClientResult.Data.CriticalIssueCount);
        Assert.Contains("AI summary unavailable", noClientResult.Data.AiSummaryMarkdown);

        // Case 2: Upstream IChatClient throws
        var failingClient = new Mock<IChatClient>();
        failingClient
            .Setup(c => c.GetResponseAsync(
                It.IsAny<IEnumerable<ChatMessage>>(),
                It.IsAny<ChatOptions?>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new HttpRequestException("429 Too Many Requests"));

        var failingResolver = new Mock<IXStaticChatClientResolver>();
        failingResolver.Setup(r => r.Resolve(It.IsAny<string?>())).Returns(failingClient.Object);

        var serviceWithFailure = new GeoSeoAuditService(
            sitesRepo.Object,
            storer.Object,
            new HtmlPageSignalExtractor(),
            failingResolver.Object,
            Options.Create(new XStaticAIOptions()),
            NullLogger<GeoSeoAuditService>.Instance);

        var errorResult = await serviceWithFailure.AuditSiteAsync(1);
        Assert.True(errorResult.WasSuccessful);
        Assert.NotNull(errorResult.Data);
        Assert.False(errorResult.Data.AiSummaryAvailable);
        Assert.Equal(1, errorResult.Data.CriticalIssueCount);
        Assert.Contains("AI summary unavailable", errorResult.Data.AiSummaryMarkdown);
    }

    [Fact]
    public async Task AiPreDeployAuditAction_WritesReportsOutsideDeployFolder_AndRespectsFailOnCritical()
    {
        var reportStore = CreateReportStore();
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
            reportStore,
            Options.Create(new XStaticAIOptions { WriteJsonReport = true }));

        // FailOnCritical = true -> returns error, but still writes report outside site output folder
        var failResult = await action.RunAction(9, new Dictionary<string, string>
        {
            [AiPreDeployAuditFields.ReportPath] = "custom-audit.md",
            [AiPreDeployAuditFields.FailOnCritical] = "true"
        });

        Assert.False(failResult.WasSuccessful);
        Assert.Contains("1 critical issue", failResult.Message);

        var reportDir = reportStore.GetSiteReportDirectory(9);
        Assert.True(File.Exists(Path.Combine(reportDir, "custom-audit.md")));
        Assert.True(File.Exists(Path.Combine(reportDir, "custom-audit.json")));
        Assert.Empty(Directory.GetFiles(_siteOutputDir));

        var latestMetadata = reportStore.ReadLatestAuditMetadata(9);
        Assert.NotNull(latestMetadata);
        Assert.Equal("custom-audit.md", latestMetadata.ReportFileName);
        Assert.Equal(1, latestMetadata.CriticalIssueCount);

        // FailOnCritical = false -> returns success
        var passResult = await action.RunAction(9, new Dictionary<string, string>
        {
            [AiPreDeployAuditFields.ReportPath] = "custom-audit.md",
            [AiPreDeployAuditFields.FailOnCritical] = "false"
        });

        Assert.True(passResult.WasSuccessful);
    }

    [Theory]
    [InlineData("../../../wwwroot/evil.md")]
    [InlineData("..\\..\\outside.md")]
    [InlineData("/etc/passwd")]
    public async Task AiPreDeployAuditAction_RejectsPathTraversalReportPaths(string maliciousPath)
    {
        var reportStore = CreateReportStore();
        var auditService = new Mock<IGeoSeoAuditService>();

        var action = new AiPreDeployAuditAction(
            auditService.Object,
            reportStore,
            Options.Create(new XStaticAIOptions()));

        var result = await action.RunAction(9, new Dictionary<string, string>
        {
            [AiPreDeployAuditFields.ReportPath] = maliciousPath
        });

        Assert.False(result.WasSuccessful);
        Assert.Contains("Invalid ReportPath", result.Message);
        auditService.Verify(
            s => s.AuditSiteAsync(It.IsAny<int>(), It.IsAny<AiAuditRequestOptions?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public void AddXStaticAI_ResolvesAiPreDeployAuditActionThroughActionFactory()
    {
        var env = new Mock<IWebHostEnvironment>();
        env.SetupGet(e => e.ContentRootPath).Returns(_contentRootDir);

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton<IConfiguration>(new ConfigurationBuilder().Build());
        services.AddSingleton(env.Object);
        services.AddSingleton(new Mock<ISitesRepository>().Object);
        services.AddSingleton(new Mock<IStaticSiteStorer>().Object);
        services.AddXStaticAI();

        using var provider = services.BuildServiceProvider();
        var actionFactory = new ActionFactory(new Mock<IActionRepository>().Object, provider);
        var created = actionFactory.CreatePostGenerationAction(new ActionDataModel
        {
            Id = 1,
            Name = "AI Audit",
            Type = typeof(AiPreDeployAuditAction).AssemblyQualifiedName
        });

        Assert.IsType<AiPreDeployAuditAction>(created);
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

    private FileSystemAuditReportStore CreateReportStore()
    {
        var env = new Mock<IWebHostEnvironment>();
        env.SetupGet(e => e.ContentRootPath).Returns(_contentRootDir);
        return new FileSystemAuditReportStore(env.Object, Options.Create(new XStaticAIOptions()));
    }

    private void WritePage(string relativePath, string html)
    {
        var fullPath = Path.Combine(_siteOutputDir, relativePath.Replace('/', Path.DirectorySeparatorChar));
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
        File.WriteAllText(fullPath, html);
    }
}
