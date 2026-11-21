using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using XStatic.AI.Configuration;
using XStatic.Core;
using XStatic.Core.Actions.FileActions;
using XStatic.Core.Generator.Storage;

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
/// Optional xStatic <see cref="XStatic.Core.Actions.IPostGenerationAction"/> that runs an AI-powered
/// pre-deploy GEO/SEO audit over generated HTML pages and writes an actionable report before deployment.
/// </summary>
[XStaticEditableField(AiPreDeployAuditFields.MaxPages, UIEditors.Integer)]
[XStaticEditableField(AiPreDeployAuditFields.ReportPath, UIEditors.Text)]
[XStaticEditableField(AiPreDeployAuditFields.FailOnCritical, UIEditors.Toggle)]
[XStaticEditableField(AiPreDeployAuditFields.ProfileAlias, UIEditors.Text)]
[XStaticEditableField(AiPreDeployAuditFields.IncludePaths, UIEditors.Text)]
public class AiPreDeployAuditAction : PostGenerationActionBase
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly IGeoSeoAuditService _auditService;
    private readonly IStaticSiteStorer _staticSiteStorer;
    private readonly IOptions<XStaticAIOptions> _aiOptions;

    public override string Name => nameof(AiPreDeployAuditAction);

    public AiPreDeployAuditAction(
        IGeoSeoAuditService auditService,
        IStaticSiteStorer staticSiteStorer,
        IOptions<XStaticAIOptions> aiOptions)
    {
        _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));
        _staticSiteStorer = staticSiteStorer ?? throw new ArgumentNullException(nameof(staticSiteStorer));
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
            await _staticSiteStorer.StoreSiteItem(staticSiteId.ToString(), reportPath, markdown, Encoding.UTF8)
                .ConfigureAwait(false);

            if (_aiOptions.Value.WriteJsonReport)
            {
                var jsonReportPath = Path.ChangeExtension(reportPath, ".json");
                var json = JsonSerializer.Serialize(report, JsonOptions);
                await _staticSiteStorer.StoreSiteItem(staticSiteId.ToString(), jsonReportPath, json, Encoding.UTF8)
                    .ConfigureAwait(false);
            }
        }
        catch (Exception ex)
        {
            return XStaticResult.Error("Failed to write AI pre-deploy audit report.", ex);
        }

        if (failOnCritical && report.CriticalIssueCount > 0)
        {
            return XStaticResult.Error(
                $"AI pre-deploy GEO/SEO audit found {report.CriticalIssueCount} critical issue(s) across {report.AuditedPageCount} audited page(s). See '{reportPath}'.");
        }

        return XStaticResult.Success(
            $"AI pre-deploy GEO/SEO audit completed for {report.AuditedPageCount} page(s) ({report.CriticalIssueCount} critical, {report.WarningIssueCount} warnings). Report saved to '{reportPath}'.");
    }
}
