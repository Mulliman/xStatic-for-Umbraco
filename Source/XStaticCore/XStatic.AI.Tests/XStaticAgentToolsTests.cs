using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using XStatic.AI.Audit;
using XStatic.AI.Security;
using XStatic.AI.Tools;
using XStatic.Core;
using XStatic.Core.Generator;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.Processes;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Models;
using XStatic.Core.Repositories;
using Xunit;

namespace XStatic.AI.Tests;

public class XStaticAgentToolsTests : IDisposable
{
    private readonly string _tempDir;
    private readonly Mock<ISitesRepository> _sitesRepo = new();
    private readonly Mock<IStaticSiteStorer> _storer = new();
    private readonly Mock<IXStaticSiteOperations> _operations = new();
    private readonly Mock<IXStaticToolAuthorizationService> _auth = new();
    private readonly Mock<IAuditReportStore> _reportStore = new();

    public XStaticAgentToolsTests()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), "xstatic-ai-tools-tests-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_tempDir);
        _auth.Setup(a => a.Authorize(It.IsAny<XStaticToolAccessLevel>(), null))
            .Returns(XStaticToolAuthorizationResult.Allowed());
    }

    public void Dispose()
    {
        if (Directory.Exists(_tempDir))
        {
            Directory.Delete(_tempDir, recursive: true);
        }
    }

    [Fact]
    public void ListSites_ReturnsConfiguredSiteSummaries()
    {
        var rootId = Guid.NewGuid();
        _sitesRepo.Setup(r => r.GetAll()).Returns(
        [
            new ExtendedGeneratedSite
            {
                Id = 7,
                Name = "Marketing Site",
                RootNode = rootId,
                ExportTypeName = "Static HTML",
                TargetHostname = "https://example.com",
                AutoPublish = true,
                DeploymentTarget = 3,
                FolderSize = "1.4 MB"
            }
        ]);

        var tools = CreateTools();
        var response = tools.ListSites();

        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        var site = Assert.Single(response.Data);
        Assert.Equal(7, site.Id);
        Assert.Equal("Marketing Site", site.Name);
        Assert.True(site.HasDeploymentTarget);
        Assert.Equal("https://example.com", site.TargetHostname);
    }

    [Fact]
    public void ListSites_ReturnsUnauthorized_WhenAuthorizationDenied()
    {
        _auth.Setup(a => a.Authorize(XStaticToolAccessLevel.NormalUser, null))
            .Returns(XStaticToolAuthorizationResult.Denied("Missing xStaticNormalUser role."));

        var tools = CreateTools();
        var response = tools.ListSites();

        Assert.False(response.Success);
        Assert.True(response.AuthorizationDenied);
        Assert.Contains("xStaticNormalUser", response.Error);
        _sitesRepo.Verify(r => r.GetAll(), Times.Never);
    }

    [Fact]
    public void GetSiteStatus_ReturnsOutputMetricsMetadataAndDeterministicAuditMetadata()
    {
        File.WriteAllText(Path.Combine(_tempDir, "index.html"), "<html><body>Home</body></html>");
        File.WriteAllText(Path.Combine(_tempDir, ".xstatic-metadata"), "Id: 4\nName: Docs");

        var latestAudit = new LatestAuditMetadata(
            GeneratedAtUtc: DateTimeOffset.UtcNow,
            AuditedPageCount: 1,
            TotalHtmlFilesDiscovered: 1,
            CriticalIssueCount: 0,
            WarningIssueCount: 2,
            AiSummaryAvailable: true,
            ReportFileName: "custom-audit.md");

        _reportStore.Setup(s => s.ReadLatestAuditMetadata(4)).Returns(latestAudit);
        _sitesRepo.Setup(r => r.Get<SiteConfig>(4)).Returns(new SiteConfig
        {
            Id = 4,
            Name = "Docs",
            RootNode = Guid.NewGuid(),
            TargetHostname = "https://docs.example.com",
            DeploymentTarget = 2
        });
        _storer.Setup(s => s.GetStorageLocationOfSite(4)).Returns(_tempDir);

        var tools = CreateTools();
        var response = tools.GetSiteStatus(4);

        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.True(response.Data.HasGeneratedOutput);
        Assert.Equal(1, response.Data.GeneratedHtmlPageCount);
        Assert.Contains("Name: Docs", response.Data.GenerationMetadata);
        Assert.Equal(latestAudit, response.Data.LatestAiAudit);
    }

    [Fact]
    public async Task GenerateSiteAsync_InvokesSiteOperationsAndReturnsSummary()
    {
        _operations.Setup(o => o.RebuildSiteAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RebuildProcessResult
            {
                SiteId = 5,
                WasSuccessful = true,
                BuildTime = 420,
                Results =
                [
                    GenerateItemResult.Success("Page", "/index.html", "OK"),
                    GenerateItemResult.Success("Page", "/about/index.html", "OK")
                ]
            });

        var tools = CreateTools();
        var response = await tools.GenerateSiteAsync(5);

        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.Equal(5, response.Data.SiteId);
        Assert.Equal(420, response.Data.BuildTimeMs);
        Assert.Equal(2, response.Data.TotalItems);
        Assert.Equal(0, response.Data.WarningCount);
    }

    [Fact]
    public async Task DeploySiteAsync_InvokesDeployOperationsAndSanitizesUnexpectedErrors()
    {
        _operations.Setup(o => o.DeploySiteAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(XStaticResult.Success("Deployed to Netlify."));

        var tools = CreateTools();
        var okResponse = await tools.DeploySiteAsync(5);

        Assert.True(okResponse.Success);
        Assert.NotNull(okResponse.Data);
        Assert.True(okResponse.Data.WasSuccessful);
        Assert.Equal("Deployed to Netlify.", okResponse.Data.Message);

        _operations.Setup(o => o.DeploySiteAsync(6, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException(@"No output at C:\secret\server\path"));

        var errResponse = await tools.DeploySiteAsync(6);
        Assert.False(errResponse.Success);
        Assert.DoesNotContain(@"C:\secret\server\path", errResponse.Error);
    }

    [Fact]
    public async Task GenerateSiteAsync_ReturnsUnauthorized_WhenAuthorizationDenied()
    {
        _auth.Setup(a => a.Authorize(XStaticToolAccessLevel.NormalUser, null))
            .Returns(XStaticToolAuthorizationResult.Denied("Missing xStaticNormalUser role."));

        var response = await CreateTools().GenerateSiteAsync(5);

        Assert.False(response.Success);
        Assert.True(response.AuthorizationDenied);
        Assert.Contains("xStaticNormalUser", response.Error);
        _operations.Verify(o => o.RebuildSiteAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeploySiteAsync_ReturnsUnauthorized_WhenAuthorizationDenied()
    {
        _auth.Setup(a => a.Authorize(XStaticToolAccessLevel.NormalUser, null))
            .Returns(XStaticToolAuthorizationResult.Denied("Missing xStaticNormalUser role."));

        var response = await CreateTools().DeploySiteAsync(5);

        Assert.False(response.Success);
        Assert.True(response.AuthorizationDenied);
        Assert.Contains("xStaticNormalUser", response.Error);
        _operations.Verify(o => o.DeploySiteAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeploySiteAsync_ReturnsSanitizedFailure_WhenDeployReturnsError()
    {
        _operations.Setup(o => o.DeploySiteAsync(8, It.IsAny<CancellationToken>()))
            .ReturnsAsync(XStaticResult.Error(@"Upload failed at C:\secret\server\path", new InvalidOperationException("boom")));

        var response = await CreateTools().DeploySiteAsync(8);

        Assert.False(response.Success);
        Assert.False(response.AuthorizationDenied);
        Assert.NotNull(response.Data);
        Assert.False(response.Data.WasSuccessful);
        Assert.Null(response.Data.Message);
        Assert.Contains("8", response.Error);
        Assert.DoesNotContain(@"C:\secret\server\path", response.Error);
        Assert.DoesNotContain(@"C:\secret\server\path", response.Data.Error);
    }

    [Fact]
    public void ConfigureChatOptions_HandlesFixedSizeToolsArray()
    {
        var provider = new XStaticAIToolProvider(CreateTools());
        var options = new ChatOptions { Tools = Array.Empty<AITool>() };

        var configured = provider.ConfigureChatOptions(options);

        Assert.Equal(4, configured.Tools?.Count);
    }

    [Fact]
    public async Task AIToolProvider_ExecutesToolThroughMockedIChatClientFunctionInvocationLoop()
    {
        _sitesRepo.Setup(r => r.GetAll()).Returns(
        [
            new ExtendedGeneratedSite { Id = 12, Name = "Main Site", RootNode = Guid.NewGuid() }
        ]);

        var provider = new XStaticAIToolProvider(CreateTools());
        var options = provider.ConfigureChatOptions();

        Assert.Equal(4, options.Tools?.Count);

        var callCount = 0;
        var innerChatClient = new Mock<IChatClient>();
        innerChatClient
            .Setup(c => c.GetResponseAsync(
                It.IsAny<IEnumerable<ChatMessage>>(),
                It.IsAny<ChatOptions?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((IEnumerable<ChatMessage> messages, ChatOptions? _, CancellationToken _) =>
            {
                callCount++;
                if (callCount == 1)
                {
                    var callContent = new FunctionCallContent("call-1", XStaticAgentTools.ListSitesToolName, new Dictionary<string, object?>());
                    return new ChatResponse(new ChatMessage(ChatRole.Assistant, [callContent]));
                }

                var toolMessage = messages.LastOrDefault(m => m.Role == ChatRole.Tool);
                var toolResultJson = toolMessage?.Contents.OfType<FunctionResultContent>().FirstOrDefault()?.Result?.ToString() ?? string.Empty;
                return new ChatResponse(new ChatMessage(ChatRole.Assistant, $"Tool returned: {toolResultJson}"));
            });

        using var chatClient = new ChatClientBuilder(innerChatClient.Object)
            .UseFunctionInvocation()
            .Build();

        var finalResponse = await chatClient.GetResponseAsync("List all xStatic sites", options);

        Assert.Equal(2, callCount);
        Assert.Contains("Main Site", finalResponse.Text);
    }

    private XStaticAgentTools CreateTools() =>
        new(
            _sitesRepo.Object,
            _storer.Object,
            _operations.Object,
            _auth.Object,
            _reportStore.Object,
            NullLogger<XStaticAgentTools>.Instance);
}
