namespace XStatic.AI.Audit;

public enum AuditSeverity
{
    Info,
    Warning,
    Critical
}

public sealed record PageAuditIssue(
    string PagePath,
    AuditSeverity Severity,
    string Category,
    string Message);

public sealed record PageAuditSnapshot(
    string RelativePath,
    string? Title,
    string? MetaDescription,
    string? CanonicalUrl,
    int H1Count,
    string? PrimaryH1,
    int TotalImageCount,
    int ImagesMissingAltCount,
    int WordCount,
    bool HasJsonLdStructuredData,
    bool HasOpenGraphTags,
    IReadOnlyList<string> BrokenInternalLinks,
    IReadOnlyList<PageAuditIssue> DeterministicIssues,
    string PlainTextExcerpt);

public sealed record AiAuditRequestOptions(
    int? MaxPages = null,
    string? ProfileAlias = null,
    IReadOnlyList<string>? IncludePathPrefixes = null,
    int? MaxCharactersPerPage = null,
    int? ThinContentWordThreshold = null);

public sealed record AiAuditReport(
    int StaticSiteId,
    string SiteName,
    DateTimeOffset GeneratedAtUtc,
    int TotalHtmlFilesDiscovered,
    int AuditedPageCount,
    int CriticalIssueCount,
    int WarningIssueCount,
    IReadOnlyList<PageAuditSnapshot> Pages,
    IReadOnlyList<PageAuditIssue> Issues,
    string AiSummaryMarkdown,
    string? ModelId = null,
    bool AiSummaryAvailable = true);
