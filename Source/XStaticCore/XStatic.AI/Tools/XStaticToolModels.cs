namespace XStatic.AI.Tools;

/// <summary>
/// Standard envelope returned by xStatic AI agent tools so LLMs receive structured success,
/// authorization, and error details without leaking sensitive deployment credentials.
/// </summary>
public sealed record XStaticToolResponse<T>(
    bool Success,
    T? Data = default,
    string? Error = null,
    bool AuthorizationDenied = false)
{
    public static XStaticToolResponse<T> Ok(T data) => new(true, data);

    public static XStaticToolResponse<T> Fail(string error) => new(false, default, error);

    public static XStaticToolResponse<T> Unauthorized(string reason) => new(false, default, reason, AuthorizationDenied: true);
}

public sealed record XStaticSiteSummary(
    int Id,
    string Name,
    Guid RootNode,
    string? ExportTypeName,
    string? TargetHostname,
    bool AutoPublish,
    bool HasDeploymentTarget,
    DateTime? LastRun,
    int? LastBuildDurationInSeconds,
    DateTime? LastDeployed,
    int? LastDeployDurationInSeconds,
    string? FolderSize);

public sealed record XStaticSiteStatusResult(
    int Id,
    string Name,
    Guid RootNode,
    string? TargetHostname,
    bool AutoPublish,
    bool HasDeploymentTarget,
    DateTime? LastRun,
    int? LastBuildDurationInSeconds,
    DateTime? LastDeployed,
    int? LastDeployDurationInSeconds,
    bool HasGeneratedOutput,
    int GeneratedHtmlPageCount,
    string? GenerationMetadata,
    string? LatestAiAuditSummary);

public sealed record XStaticGenerateSiteResult(
    int SiteId,
    bool WasSuccessful,
    long BuildTimeMs,
    int TotalItems,
    int WarningCount,
    IReadOnlyList<string> Warnings,
    string? Error);

public sealed record XStaticDeploySiteResult(
    int SiteId,
    bool WasSuccessful,
    string? Message,
    string? Error);
