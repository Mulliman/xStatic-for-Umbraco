using Microsoft.Extensions.Options;
using XStatic.AI.Configuration;
using XStatic.Core;
using XStatic.Core.Actions.FileActions;

namespace XStatic.AI.Audit;

public static class AiPreDeployAuditFields
{
    public const string MaxPages = "MaxPages";
    public const string ReportPath = "ReportPath";
    public const string FailOnCritical = "FailOnCritical";
    public const string ProfileAlias = "ProfileAlias";
    public const string IncludePaths = "IncludePaths";
}

/// <summary>
/// Optional xStatic <see cref="XStatic.Core.Actions.IPostGenerationAction"/> that runs a deterministic
/// and AI-assisted GEO/SEO audit over generated HTML pages and writes an actionable report outside
/// the deployable static site folder.
/// </summary>
[XStaticEditableField(AiPreDeployAuditFields.MaxPages, UIEditors.Integer)]
[XStaticEditableField(AiPreDeployAuditFields.ReportPath, UIEditors.Text)]
[XStaticEditableField(AiPreDeployAuditFields.FailOnCritical, UIEditors.Toggle)]
[XStaticEditableField(AiPreDeployAuditFields.ProfileAlias, UIEditors.Text)]
[XStaticEditableField(AiPreDeployAuditFields.IncludePaths, UIEditors.Text)]
public class AiPreDeployAuditAction : PostGenerationActionBase
{
    private readonly IGeoSeoAuditService _auditService;
    private readonly IAuditReportStore _reportStore;
    private readonly IOptions<XStaticAIOptions> _aiOptions;

    public override string Name => nameof(AiPreDeployAuditAction);

    public AiPreDeployAuditAction(
        IGeoSeoAuditService auditService,
        IAuditReportStore reportStore,
        IOptions<XStaticAIOptions> aiOptions)
    {
        _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));
        _reportStore = reportStore ?? throw new ArgumentNullException(nameof(reportStore));
        _aiOptions = aiOptions ?? throw new ArgumentNullException(nameof(aiOptions));
    }

    public override async Task<XStaticResult> RunAction(int staticSiteId, Dictionary<string, string>? parameters)
    {
        parameters ??= new Dictionary<string, string>();

        int? maxPages = int.TryParse(GetParameter(parameters, AiPreDeployAuditFields.MaxPages), out var parsedMaxPages) && parsedMaxPages > 0
            ? parsedMaxPages
            : null;

        var profileAlias = GetParameter(parameters, AiPreDeployAuditFields.ProfileAlias);

        var includePathsRaw = GetParameter(parameters, AiPreDeployAuditFields.IncludePaths);
        var includePaths = string.IsNullOrWhiteSpace(includePathsRaw)
            ? null
            : includePathsRaw
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToList();

        var failOnCriticalParam = GetParameter(parameters, AiPreDeployAuditFields.FailOnCritical);
        var failOnCritical = bool.TryParse(failOnCriticalParam, out var parsedFailOnCritical)
            ? parsedFailOnCritical
            : _aiOptions.Value.FailOnCriticalIssues;

        var reportPath = GetParameter(parameters, AiPreDeployAuditFields.ReportPath);
        if (string.IsNullOrWhiteSpace(reportPath))
        {
            reportPath = _aiOptions.Value.DefaultReportFileName;
        }

        // Validate ReportPath before running the audit so invalid/traversal paths fail fast
        try
        {
            var siteReportDir = _reportStore.GetSiteReportDirectory(staticSiteId);
            FileSystemAuditReportStore.ResolveSafePath(siteReportDir, reportPath);
        }
        catch (ArgumentException ex)
        {
            return XStaticResult.Error($"Invalid ReportPath '{reportPath}': {ex.Message}", ex);
        }

        var auditResult = await _auditService.AuditSiteAsync(
            staticSiteId,
            new AiAuditRequestOptions(
                MaxPages: maxPages,
                ProfileAlias: profileAlias,
                IncludePathPrefixes: includePaths))
            .ConfigureAwait(false);

        if (!auditResult.WasSuccessful || auditResult.Data is null)
        {
            return XStaticResult.Error(auditResult.Message ?? "AI pre-deploy GEO/SEO audit failed.", auditResult.Exception);
        }

        var report = auditResult.Data;
        var markdown = _auditService.FormatMarkdownReport(report);

        try
        {
            await _reportStore.SaveReportAsync(
                staticSiteId,
                reportPath,
                markdown,
                report,
                _aiOptions.Value.WriteJsonReport)
                .ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            return XStaticResult.Error("Failed to write AI pre-deploy audit report.", ex);
        }

        if (failOnCritical && report.CriticalIssueCount > 0)
        {
            return XStaticResult.Error(
                $"AI pre-deploy GEO/SEO audit found {report.CriticalIssueCount} critical issue(s) across {report.AuditedPageCount} audited page(s). Report saved as '{reportPath}'.");
        }

        return XStaticResult.Success(
            $"AI pre-deploy GEO/SEO audit completed for {report.AuditedPageCount} page(s) ({report.CriticalIssueCount} critical, {report.WarningIssueCount} warnings). Report saved as '{reportPath}'.");
    }
}
