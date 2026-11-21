using System.ComponentModel;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using XStatic.AI.Configuration;
using XStatic.AI.Security;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Repositories;

namespace XStatic.AI.Tools;

/// <summary>
/// Callable tool methods exposing xStatic static site management to <c>Microsoft.Extensions.AI</c>
/// and <c>Umbraco.AI.Agent</c> copilots while enforcing <see cref="XStatic.Security.XStaticRoles"/>.
/// </summary>
public class XStaticAgentTools
{
    public const string ListSitesToolName = "xstatic_list_sites";
    public const string GetSiteStatusToolName = "xstatic_get_site_status";
    public const string GenerateSiteToolName = "xstatic_generate_site";
    public const string DeploySiteToolName = "xstatic_deploy_site";

    private const int MaxWarningsReturned = 20;
    private const int MaxAuditPreviewLength = 2000;

    private readonly ISitesRepository _sitesRepository;
    private readonly IStaticSiteStorer _staticSiteStorer;
    private readonly IXStaticSiteOperations _siteOperations;
    private readonly IXStaticToolAuthorizationService _authorizationService;
    private readonly IOptions<XStaticAIOptions> _aiOptions;
    private readonly ILogger<XStaticAgentTools> _logger;

    public XStaticAgentTools(
        ISitesRepository sitesRepository,
        IStaticSiteStorer staticSiteStorer,
        IXStaticSiteOperations siteOperations,
        IXStaticToolAuthorizationService authorizationService,
        IOptions<XStaticAIOptions> aiOptions,
        ILogger<XStaticAgentTools> logger)
    {
        _sitesRepository = sitesRepository ?? throw new ArgumentNullException(nameof(sitesRepository));
        _staticSiteStorer = staticSiteStorer ?? throw new ArgumentNullException(nameof(staticSiteStorer));
        _siteOperations = siteOperations ?? throw new ArgumentNullException(nameof(siteOperations));
        _authorizationService = authorizationService ?? throw new ArgumentNullException(nameof(authorizationService));
        _aiOptions = aiOptions ?? throw new ArgumentNullException(nameof(aiOptions));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    [Description("Lists all configured xStatic static sites, including their IDs, names, hostnames, and last generation/deployment timestamps.")]
    public XStaticToolResponse<IReadOnlyList<XStaticSiteSummary>> ListSites()
    {
        var auth = _authorizationService.Authorize(XStaticToolAccessLevel.NormalUser);
        if (!auth.IsAuthorized)
        {
            return XStaticToolResponse<IReadOnlyList<XStaticSiteSummary>>.Unauthorized(
                auth.DenialReason ?? "Access denied.");
        }

        var sites = _sitesRepository.GetAll()
            .Select(site => new XStaticSiteSummary(
                Id: site.Id,
                Name: site.Name ?? string.Empty,
                RootNode: site.RootNode,
                ExportTypeName: site.ExportTypeName,
                TargetHostname: site.TargetHostname,
                AutoPublish: site.AutoPublish,
                HasDeploymentTarget: site.DeploymentTarget.HasValue,
                LastRun: site.LastRun,
                LastBuildDurationInSeconds: site.LastBuildDurationInSeconds,
                LastDeployed: site.LastDeployed,
                LastDeployDurationInSeconds: site.LastDeployDurationInSeconds,
                FolderSize: site.FolderSize))
            .ToList();

        return XStaticToolResponse<IReadOnlyList<XStaticSiteSummary>>.Ok(sites);
    }

    [Description("Inspects the status, last generation/deployment metadata, generated HTML page count, and latest AI audit report for a specific xStatic site.")]
    public XStaticToolResponse<XStaticSiteStatusResult> GetSiteStatus(
        [Description("The numeric ID of the configured xStatic site.")] int staticSiteId)
    {
        var auth = _authorizationService.Authorize(XStaticToolAccessLevel.NormalUser);
        if (!auth.IsAuthorized)
        {
            return XStaticToolResponse<XStaticSiteStatusResult>.Unauthorized(
                auth.DenialReason ?? "Access denied.");
        }

        var site = _sitesRepository.Get<SiteConfig>(staticSiteId);
        if (site is null)
        {
            return XStaticToolResponse<XStaticSiteStatusResult>.Fail(
                $"xStatic site with ID {staticSiteId} was not found.");
        }

        var storagePath = _staticSiteStorer.GetStorageLocationOfSite(site.Id);
        var hasOutput = !string.IsNullOrWhiteSpace(storagePath) && Directory.Exists(storagePath);
        var htmlCount = 0;
        string? metadata = null;
        string? latestAudit = null;

        if (hasOutput)
        {
            htmlCount = Directory.EnumerateFiles(storagePath, "*.html", SearchOption.AllDirectories).Count()
                + Directory.EnumerateFiles(storagePath, "*.htm", SearchOption.AllDirectories).Count();

            var metadataPath = Path.Combine(storagePath, ".xstatic-metadata");
            if (File.Exists(metadataPath))
            {
                metadata = File.ReadAllText(metadataPath);
            }

            var auditFileName = string.IsNullOrWhiteSpace(_aiOptions.Value.DefaultReportFileName)
                ? ".xstatic-ai-audit.md"
                : _aiOptions.Value.DefaultReportFileName.TrimStart('/', '\\');

            var auditPath = Path.Combine(storagePath, auditFileName);
            if (File.Exists(auditPath))
            {
                var content = File.ReadAllText(auditPath);
                latestAudit = content.Length > MaxAuditPreviewLength
                    ? content[..MaxAuditPreviewLength] + "\n...[truncated]"
                    : content;
            }
        }

        var status = new XStaticSiteStatusResult(
            Id: site.Id,
            Name: site.Name ?? string.Empty,
            RootNode: site.RootNode,
            TargetHostname: site.TargetHostname,
            AutoPublish: site.AutoPublish,
            HasDeploymentTarget: site.DeploymentTarget.HasValue,
            LastRun: site.LastRun,
            LastBuildDurationInSeconds: site.LastBuildDurationInSeconds,
            LastDeployed: site.LastDeployed,
            LastDeployDurationInSeconds: site.LastDeployDurationInSeconds,
            HasGeneratedOutput: hasOutput,
            GeneratedHtmlPageCount: htmlCount,
            GenerationMetadata: metadata,
            LatestAiAuditSummary: latestAudit);

        return XStaticToolResponse<XStaticSiteStatusResult>.Ok(status);
    }

    [Description("Triggers static site generation (build) for the specified xStatic site ID and returns build duration, item count, and any warnings.")]
    public async Task<XStaticToolResponse<XStaticGenerateSiteResult>> GenerateSiteAsync(
        [Description("The numeric ID of the configured xStatic site to generate.")] int staticSiteId,
        CancellationToken cancellationToken = default)
    {
        var auth = _authorizationService.Authorize(XStaticToolAccessLevel.NormalUser);
        if (!auth.IsAuthorized)
        {
            return XStaticToolResponse<XStaticGenerateSiteResult>.Unauthorized(
                auth.DenialReason ?? "Access denied.");
        }

        try
        {
            var result = await _siteOperations.RebuildSiteAsync(staticSiteId, cancellationToken).ConfigureAwait(false);
            var warnings = result.Warnings
                .Take(MaxWarningsReturned)
                .Select(w => $"{w.Type} ({w.Item}): {w.Message}")
                .ToList();

            var payload = new XStaticGenerateSiteResult(
                SiteId: result.SiteId,
                WasSuccessful: result.WasSuccessful,
                BuildTimeMs: result.BuildTime,
                TotalItems: result.Results?.Count ?? 0,
                WarningCount: result.Warnings.Count,
                Warnings: warnings,
                Error: result.Exception);

            return result.WasSuccessful
                ? XStaticToolResponse<XStaticGenerateSiteResult>.Ok(payload)
                : new XStaticToolResponse<XStaticGenerateSiteResult>(false, payload, result.Exception ?? "Site generation completed with warnings/errors.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "xStatic AI tool failed while generating site {SiteId}", staticSiteId);
            return XStaticToolResponse<XStaticGenerateSiteResult>.Fail(ex.Message);
        }
    }

    [Description("Deploys the most recently generated output for the specified xStatic site ID to its configured deployment target.")]
    public async Task<XStaticToolResponse<XStaticDeploySiteResult>> DeploySiteAsync(
        [Description("The numeric ID of the configured xStatic site to deploy.")] int staticSiteId,
        CancellationToken cancellationToken = default)
    {
        var auth = _authorizationService.Authorize(XStaticToolAccessLevel.NormalUser);
        if (!auth.IsAuthorized)
        {
            return XStaticToolResponse<XStaticDeploySiteResult>.Unauthorized(
                auth.DenialReason ?? "Access denied.");
        }

        try
        {
            var result = await _siteOperations.DeploySiteAsync(staticSiteId, cancellationToken).ConfigureAwait(false);
            var payload = new XStaticDeploySiteResult(
                SiteId: staticSiteId,
                WasSuccessful: result.WasSuccessful,
                Message: result.Message,
                Error: result.Exception?.Message);

            return result.WasSuccessful
                ? XStaticToolResponse<XStaticDeploySiteResult>.Ok(payload)
                : new XStaticToolResponse<XStaticDeploySiteResult>(false, payload, result.Message ?? result.Exception?.Message ?? "Deployment failed.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "xStatic AI tool failed while deploying site {SiteId}", staticSiteId);
            return XStaticToolResponse<XStaticDeploySiteResult>.Fail(ex.Message);
        }
    }
}
